const { ChatGoogleVertexAI } = require("@langchain/community/chat_models/googlevertexai");
const { AIMessage, HumanMessage, SystemMessage} = require( "@langchain/core/messages");
const { setValue, getValue , saveChatID: saveChat, setRate } = require("./firebase");
const { X_API_KEY } = require("./constants")
const { SYS_PROMPT_TEMPLATE_V2 :SYS_PROMPT_TEMPLATE , explainZod , explainationPrompt , classificationPrompt } = require("./prompts");
const moment = require("moment")
const examples = require("../examples/conversation");
const { gemini , openAI, chatOpenAI } = require("./gemini");
const { StructuredOutputParser } = require("@langchain/core/output_parsers");
const { PromptTemplate } = require("@langchain/core/prompts");
const { canAnswer } = require("./preai");

const model = new ChatGoogleVertexAI({
    temperature: 0.3,
    model:"chat-bison@002",
    examples: examples,
    topP: 1,
    // topK: 5,
    maxOutputTokens: 1024,
    cache: false,
})

function getTimeSlots(){
    return [
        moment().add(1,"days").format("MMMM D, YYYY h:mm A"),
        moment().add(1,"days").add(2,"hours").format("MMMM D, YYYY h:mm A"),
        moment().add(2,"days").format("MMMM D, YYYY h:mm A"),
        moment().add(3,"days").format("MMMM D, YYYY h:mm A"),
        moment().add(4,"days").format("MMMM D, YYYY h:mm A"),
        moment().add(5,"days").format("MMMM D, YYYY h:mm A"),
    ]
}

function duplicateDates(slots) {
    let dates = {}
    for (let slot of slots) {
        let date = moment(slot,"MMMM D, YYYY h:mm A").format("MMMM D, YYYY")
        dates[date] = dates[date] ? dates[date] + 1 : 1
    }
    return Object.keys(dates).filter(date => dates[date] > 1)
}

function duplicateTimes(slots) {
    let times = {}
    for (let slot of slots) {
        let time = moment(slot,"MMMM D, YYYY h:mm A").format("h:mm A")
        let date = moment(slot,"MMMM D, YYYY h:mm A").format("MMMM D, YYYY")
        times[time] = [...(times[time] || []), date]
    }
    return Object.keys(times).map(time=> times[time]).filter(dates => dates.length > 1).map(dates=> dates.map(date=> moment(date).format("MMMM D"))).join("\n- ")
}

function buildSysPrompt(orgName , timeslots , duplicateDatesList , duplicateTimesList , explainationPrompt){
    const promptTemplate = PromptTemplate.fromTemplate(SYS_PROMPT_TEMPLATE)
    return promptTemplate.format({
        orgName: orgName,
        services:"- Car wash\n- Window cleaning\n- Interior cleaning\n- Waxing\n- Oil change\n- Tire rotation\n- Windshield Cleaning",
        availableTimeSlots: timeslots.join("\n- "),
        appointmentNumber: Math.floor(Math.random() * 10000), // Random number between 0 and 1000
        tasks: "appointment scheduling, rescheduling, cancellation and answering questions about company information, services, and available time slots",
        multipleTimeslotsDates: duplicateDatesList,
        multipleDatesTimeslots: duplicateTimesList,
        explainPrompt: explainationPrompt,
    })
}

async function startChat(req,res) {
    try {
        const conversationID = req.headers[X_API_KEY]
        if (typeof conversationID === "undefined" || conversationID === null) {
            res.status(401).json({error: "Unauthorized"})
            return
        }
        const orgName = req.body.orgName
        const timeslots = getTimeSlots()
        let duplicateDatesList = duplicateDates(timeslots)
        let duplicateTimesList = duplicateTimes(timeslots)
        let messages = [
            new SystemMessage(await buildSysPrompt(orgName , timeslots , duplicateDatesList , duplicateTimesList)),
            new HumanMessage("Hi" , {category: 200}),
            new AIMessage(`Hi Jane, I am an agent of ${orgName}. I would like to schedule an appointment for your car wash needs. Is ${timeslots[0]} convenient for you?`),
        ]
        let conversationDicts = toMsgs(messages)
        await setValue(conversationID,conversationDicts,false , timeslots)
        res.status(201).json({conversationID: conversationID})
    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Internal Server Error"})
    }
}

async function chat(req,res) {
    try {
        const conversationID = getConversationID(req)
        if (typeof conversationID === "undefined" || conversationID === null) {
            res.status(401).json({error: "Unauthorized"})
            return
        }
        let messages = await getValue(conversationID)
        if (messages === null || !Array.isArray(messages.conversation) || messages.conversation.length === 0) {
            res.status(404).json({error: "Conversation not found"})
            return
        }
        messages.conversation.push({type:"Human",content:req.body.content,timestamp:new Date().toISOString()})
        await setValue(conversationID,{type:"Human",content:req.body.content,timestamp:new Date().toISOString()},true)
        processor(conversationID,messages.conversation,req.body.orgName , messages.timeSlots) // Process the conversation asynchronously
        res.status(200).json({action: "processing"}) // Return the conversation
    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Internal Server Error"})
        return
    }
}

async function processor(conversationID , messages , orgName , slots){
    try {
        let lastMsg = messages[messages.length - 1].content
        let conversationWithoutLastMsg = messages.slice(0,messages.length - 1)
        let explanation = await explain(conversationWithoutLastMsg , lastMsg , slots)
        let explainPrompt = explainResults(explanation)
        let explanationGemini = await explainGemini(conversationWithoutLastMsg , lastMsg , slots) // Explain using Gemini
        let conversation = [await getSysMsg(orgName , slots , explainPrompt),...fromMsgs(messages)] // Add system message to the conversation
        let chatOpenAIModel = chatOpenAI(0.2,1,1)
        let response = await chatOpenAIModel.invoke(conversation)
        let content = response.content.trimStart().trimEnd()
        content = content.replace("[available time slots]",slots.join("\n- "))
        await setValue(conversationID,{type:"AI",content:content,timestamp:new Date().toISOString()},false)
    } catch (error) {
        console.log(error)
    }
}

async function getSysMsg(orgName , slots , explainPrompt) {
    let duplicateDatesList = duplicateDates(slots)
    let duplicateTimesList = duplicateTimes(slots)
    return new SystemMessage(await buildSysPrompt(orgName, slots , duplicateDatesList , duplicateTimesList,explainPrompt))
}

function fromMsgs(msgs) {
    let messages = []
    for (let msg of msgs) {
        if (msg.type === "AI") {
            messages.push(new AIMessage(msg.content))
        } else if (msg.type === "System") {
            // messages.push(new SystemMessage(msg.content))
            continue
        } else {
            messages.push(new HumanMessage(msg.content))
        }
    }
    return messages
}

function getConversationID(req){
    return req.headers[X_API_KEY]
}

async function saveChatID(req , res) {
    try {
        const conversationID = req.headers[X_API_KEY]
        if (typeof conversationID === "undefined" || conversationID === null) {
            res.status(401).json({error: "Unauthorized"})
            return
        }
        await saveChat(conversationID)
        res.status(201).json({message:"Chat saved Successfully. Thank you for your suppor!"})
        return
    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Internal Server Error"})
        return
    }
}

function toMsgs(messages) {
    let conversation = []
    for (let message of messages) {
        if (message instanceof AIMessage) {
            conversation.push({
                type: "AI",
                content: message.content,
                timestamp: new Date().toISOString()
            })
        } else if (message instanceof SystemMessage) {
            conversation.push({
                type: "System",
                content: message.content,
                timestamp: new Date().toISOString()
            })
        }else {
            conversation.push({
                type: "Human",
                content: message.content,
                timestamp: new Date().toISOString(),
                category: message.lc_kwargs?.additional_kwargs?.category,
            })
        }
    }
    return conversation
}

async function rateChat(req , res){
    try {
        const conversationID = req.headers[X_API_KEY]
        if (typeof conversationID === "undefined" || conversationID === null) {
            res.status(401).json({error: "Unauthorized"})
            return
        }
        const rating = Number(req.body.rating)
        if (isNaN(rating) || rating < 1 || rating > 5) {
            res.status(400).json({error: "Invalid rating"})
            return
        }
        await setRate(conversationID,rating)
        res.status(201).json({message:"Chat rated successfully. Thank you for your support!"})
        return
    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Internal Server Error"})
        return
    }
}

async function explainPrompt(conversation , lastMessage , slots){
    // return PromptTemplate.fromTemplate("This message is sent by the customer "+
    //     "to a customer service agent. "+
    //     "The agent can only do the following tasks: {tasks}"+
    //     "The company of the agent is offering following services: {services}. "+
    //     "Company is accepting appointments on the following time slots: {timeslots}. "+
    //     "This message is a part of a conversation. "+
    //     "You should understand the conversation history and give an explanation about the last message. "+
    //     "Explain about the following points: "+
    //     "\n- What is customer asking for."+
    //     "\n- If customer sends a message only with a date or time give the full date and time according "+
    //     "to the conversation history. time format is MMMM D, YYYY h:mm A "+
    //     "\n- The agent has knowledge about their company. Determine the relativeness of the message to the company details."+
    //     "when you determine the relativeness, you should consider the following points: \n"+
    //     "\n- The message is a follow-up message to the previous conversation. if the message is a follow-up message, always analyze the full conversation history, then determine the relativeness according to the following points: "+
    //     "\n- The message is related to the company services. "+
    //     "\n- The message is related to the company time slots. "+
    //     "\n- can agent provide the service that the customer is asking for. "+
    //     "\n The customer is asking for a service that is not available in the company services. "+
    //     "\n- The customer is asking for a time slot that is not available in the company time slots. "+
    //     "if the message is not a follow-up message, determine the relativeness according to the following points: "+
    //     "\n- The message is related to the company services. "+
    //     "\n- The message is related to the company time slots. "+
    //     "\n- The customer is asking for a service that is not available in the company services. "+
    //     "\n- The customer is asking for a time slot that is not available in the company time slots. "+
    //     "\n- can agent provide the service that the customer is asking for. "+
    //     "\nConversation History: {conversation}"+
    //     "\nLast Message: {lastMessage}"+
    //     "{output_instructions}"
    // )
    // let promptTemplate = new PromptTemplate({
    //     inputVariables: ["services","timeslots","conversation","lastMessage","output_instructions","tasks"],
    //     template: explainationPrompt,
    //     outputParser: StructuredOutputParser.fromZodSchema(explainZod),
    // })
    // let outputParser = StructuredOutputParser.fromZodSchema(explainZod)
    const template = PromptTemplate.fromTemplate(explainationPrompt)
    // console.log(await template.format({
    //     services:"- Car wash\n- Window cleaning\n- Interior cleaning\n- Waxing\n- Oil change\n- Tire rotation\n- Windshield Cleaning",
    //         timeslots: slots.join("\n- "),
    //         conversation: conversationToString(conversation),
    //         lastMessage: lastMessage,
    //         output_instructions: outputParser.getFormatInstructions(),
    //         tasks: "appointment scheduling, rescheduling, cancellation and answering questions about company information, services, and available time slots",
    // }))
    return template
}

function conversationToString(conversation){
    // get last 10 messages
    conversation = conversation.slice(-10)
    let messages = []
    for (let message of conversation) {
        if (message.type === "AI") {
            messages.push(`Agent: ${message.content}`)
        } else if (message.type === "System") {
            continue
        }else {
            messages.push(`Customer: ${message.content}`)
        }
    }
    return messages.join("\n")
}

async function explain(conversation , lastMessage , slots){
    try {
        let model = openAI(0.2,1,1)
        let outputParser = StructuredOutputParser.fromZodSchema(explainZod)
        let prompt = await explainPrompt(conversation , lastMessage , slots)
        let chain = prompt.pipe(model).pipe(outputParser)
        let res = await chain.invoke({
            services:"- Car wash\n- Window cleaning\n- Interior cleaning\n- Waxing\n- Oil change\n- Tire rotation\n- Windshield Cleaning",
            timeslots: slots.join("\n- "),
            conversation: conversationToString(conversation),
            lastMessage: lastMessage,
            output_instructions: outputParser.getFormatInstructions(),
            tasks: "appointment scheduling, rescheduling, cancellation and answering questions about company information, services, and available time slots",
            orgName: "ABC Car Wash",
        })
        console.log("explain res",res)
        return res
    } catch (error) {
        console.error("explain Err",error)
    }
}

async function explainGemini(conversation , lastMessage , slots){
    try {
        let model = gemini(0.2,1,1)
        let outputParser = StructuredOutputParser.fromZodSchema(explainZod)
        let prompt = await explainPrompt(conversation , lastMessage , slots)
        let chain = prompt.pipe(model).pipe(outputParser)
        let res = await chain.invoke({
            services:"- Car wash\n- Window cleaning\n- Interior cleaning\n- Waxing\n- Oil change\n- Tire rotation\n- Windshield Cleaning",
            timeslots: slots.join("\n- "),
            conversation: conversationToString(conversation),
            lastMessage: lastMessage,
            output_instructions: outputParser.getFormatInstructions(),
            tasks: "appointment scheduling, rescheduling, cancellation and answering questions about company information, services, and available time slots",
            orgName: "ABC Car Wash",
        })
        console.log("explain res",res)
        return res
    } catch (error) {
        console.error("explain Err",error)
    }
}

function explainResults(explaination) {
    let prompts = []
    let objKeys = Object.keys(explaination)
    for (let key of objKeys) {
        if (explaination[key] === true) {
            prompts.push(explainationPromptTemplates(key))
        }else if (explaination[key] === false){
            prompts.push(falseExplationPrompts(key))
        }else{
            continue
        }
    }
    return prompts.join("\n")
}

function explainationPromptTemplates(key) {
    let templates = {
        canAgentProvideTask:"Since human's request is related to your tasks, always provide the task 100% accurately.",
        isCompanyProvidesTheService:"Your company provides the service that the human is asking for.",
        canAgentProvideAnswer: "Since you have the required knowledge to answer the human's question, always provide the answer 100% accurately.",
        isAcceptingAppointment: "Your company is accepting appointments on the time slot that the human is asking for.",
    }
    return templates[key] || ""
}

function falseExplationPrompts(key) {
    let templates = {
        canAgentProvideTask:"you can't do the task that the human is asking for.",
        isCompanyProvidesTheService:"Your company does not provide the service that the customer is asking for.",
        canAgentProvideAnswer: "Since you don't know the answer to the human's question, Explain friendly that you don't have the required knowledge to answer the human's question.",
        isAcceptingAppointment: "Your comopany is not accepting appointments on the time slot that the human is asking for. Explain friendly that your company is not accepting appointments on the time slot that the human is asking for. Suggest an available time slots.",
    }
    return templates[key] || ""
}

module.exports = {
    startChat,
    chat,
    saveChatID,
    rateChat
}