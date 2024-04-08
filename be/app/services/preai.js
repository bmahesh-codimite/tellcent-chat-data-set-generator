const { abilityZod , abilityPrompt } = require("./prompts");
const { gemini } = require("./gemini");
const { StructuredOutputParser } = require("@langchain/core/output_parsers");
const { PromptTemplate } = require("@langchain/core/prompts");

module.exports = {
    canAnswer
}

function buildAbilityPrompt(){
    return PromptTemplate.fromTemplate(abilityPrompt);
}

async function canAnswer(message) {
    try {
        const prompt = buildAbilityPrompt();
        const outputParser = getAbilityOutputParser();
        const model = gemini(0.2,1,1)
        const response = await prompt.pipe(model).pipe(outputParser).invoke({
            conversation: message,
            agentKnowledge: "\n- Splash Car Wash location\n-Car wash\n- Window cleaning\n- Interior cleaning\n- Waxing\n- Oil change\n- Tire rotation\n- Windshield Cleaning",
            output_instructions: outputParser.getFormatInstructions(),
            tasks: "appointment scheduling, rescheduling, cancellation and answering questions about company information, services, and available time slots"
        })
        return response
    } catch (error) {
        console.error(error)
    }
}

function getAbilityOutputParser(){
    return StructuredOutputParser.fromZodSchema(abilityZod)
}