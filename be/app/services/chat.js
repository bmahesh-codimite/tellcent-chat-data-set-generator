const { ChatGoogleVertexAI } = require("@langchain/community/chat_models/googlevertexai");
const { AIMessage, HumanMessage, SystemMessage} = require( "@langchain/core/messages");
const { setValue, getValue } = require("./firebase");
const { X_API_KEY } = require("./constants")
const { PromptTemplate } = require("@langchain/core/prompts");
const { SYS_PROMPT_TEMPLATE } = require("./prompts");
const moment = require("moment")
const examples = require("../examples/conversation")

const model = new ChatGoogleVertexAI({
    temperature: 0.3,
    model:"chat-bison@002",
    examples: examples,
})

function getTimeSlots(){
    return [
        moment().add(1,"days").format("MMMM D, YYYY h:mm A"),
        moment().add(2,"days").format("MMMM D, YYYY h:mm A"),
        moment().add(3,"days").format("MMMM D, YYYY h:mm A"),
        moment().add(4,"days").format("MMMM D, YYYY h:mm A"),
        moment().add(5,"days").format("MMMM D, YYYY h:mm A"),
    ]
}

function buildSysPrompt(orgName){
    const promptTemplate = PromptTemplate.fromTemplate(SYS_PROMPT_TEMPLATE)
    return promptTemplate.format({
        orgName: orgName,
        services:"- Car wash\n- Window cleaning\n- Interior cleaning\n- Waxing\n- Oil change\n- Tire rotation\n- Windshield Cleaning",
        availableTimeSlots: getTimeSlots().join("\n- "),
        appointmentNumber: Math.floor(Math.random() * 1000) // Random number between 0 and 1000
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
        let messages = [
            // new SystemMessage("Welcome to the chat!"),
            new HumanMessage("Hi" , {category: 200}),
            new AIMessage(`Hi I am an agent of ${orgName}. I would like to schedule an appointment for your car wash needs. Is ${new Date().toLocaleDateString()} at 10:00 AM convenient for you?`),
        ]
        let conversationDicts = toMsgs(messages)
        await setValue(conversationID,conversationDicts)
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
        if (messages === null || !Array.isArray(messages) || messages.length === 0) {
            res.status(404).json({error: "Conversation not found"})
            return
        }
        messages.push({type:"Human",content:req.body.content,timestamp:new Date().toISOString()})
        await setValue(conversationID,{type:"Human",content:req.body.content,timestamp:new Date().toISOString()})
        processor(conversationID,messages,req.body.orgName) // Process the conversation asynchronously
        res.status(200).json({action: "processing"}) // Return the conversation
    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Internal Server Error"})
        return
    }
}

async function processor(conversationID , messages , orgName){
    try {
        let conversation = [await getSysMsg(orgName),...fromMsgs(messages)] // Add system message to the conversation
        let response = await model.invoke(conversation)
        let content = response.content.trimStart().trimEnd()
        await setValue(conversationID,{type:"AI",content:content,timestamp:new Date().toISOString()})
    } catch (error) {
        console.log(error)
    }
}

async function getSysMsg(orgName) {
    return new SystemMessage(await buildSysPrompt(orgName))
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
            continue
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

module.exports = {
    startChat,
    chat
}