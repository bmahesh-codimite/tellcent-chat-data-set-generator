const { AIMessage, HumanMessage } = require( "@langchain/core/messages");

module.exports = [
    {
        input: new HumanMessage("Hi"),
        output: new AIMessage("Hi, how can I help you today?")
    },
    {
        input: new HumanMessage("Hello"),
        output: new AIMessage("Hi, how can I support you today?")
    },
    {
        input: new HumanMessage("Who are you?"),
        output: new AIMessage("I am an agent from [Company Name] to support you through our services")
    },
    {
        input: new HumanMessage("Hi"),
        output: new AIMessage("How about the above provided time slot? is it convenient for you?")
    }
]