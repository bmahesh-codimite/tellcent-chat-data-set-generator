const { ChatGoogleGenerativeAI } = require("@langchain/google-genai")
const { HarmBlockThreshold, HarmCategory } = require("@google-cloud/vertexai")
const { OpenAI , ChatOpenAI } = require("@langchain/openai")

function gemini(temperature , topP , topK){
    return new ChatGoogleGenerativeAI({
        modelName: "gemini-1.0-pro",
        apiKey: process.env.GOOGLE_API_KEY,
        maxOutputTokens: 2048,
        temperature: temperature || 0.2,
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            }
        ],
        topP: topP || 0.8,
        topK: topK || 1,
    })
}

function openAI(temperature , topP , topK){
    return new OpenAI({
        modelName: "gpt-3.5-turbo",
        configuration:{
            organization: process.env.OPENAI_ORG_ID,
            apiKey: process.env.OPENAI_API_KEY,
        },
        temperature: temperature || 0.2,
    })
}

function chatOpenAI(temperature , topP , topK){
    return new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        configuration:{
            organization: process.env.OPENAI_ORG_ID,
            apiKey: process.env.OPENAI_API_KEY,
        }
    })
}

module.exports = {
    gemini,
    openAI,
    chatOpenAI
}