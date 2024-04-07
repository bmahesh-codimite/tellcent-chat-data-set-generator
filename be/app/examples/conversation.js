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
    },
    {
        input: new HumanMessage("Hi I want to reschedule my appointment"),
        output: new AIMessage("Which time slot works for you? [available time slots]"),
    },
    {
        input: new HumanMessage("I want to reschedule my appointment"),
        output: new AIMessage("Which time slot works for you? [available time slots]"),
    },
    {
        input: new HumanMessage("I can't make it to my appointment"),
        output: new AIMessage("No problem, we can reschedule it for you. Which time slot works for you? [available time slots]"),
    },
    {
        input: new HumanMessage("Hello I want to reschedule my appointment"),
        output: new AIMessage("Sure, which time slot works for you? [available time slots]"),
    },
    {
        input: new HumanMessage("Hi I want to cancel my appointment"),
        output: new AIMessage("Are you sure you want to cancel your appointment?\n or we can reschedule it for you."),
    },
    {
        input: new HumanMessage("let's reschedule my appointment"),
        output: new AIMessage("Sure, I can help you with that. We are available on the following dates and times.\n [available time slots] \nWhich date or time slot works for you?"),
    },
    {
        input: new HumanMessage("My pet is sick"),
        output: new AIMessage("I'm sorry to hear that. I see you are really loving your pet. Can I know your pet's name?"),
    },
    {
        input: new HumanMessage("Shiba"),
        output: new AIMessage("Oh, Shiba is a cute name. Your pet will be fine. Is there anything else I can help you with?"),
    },
    {
        input: new HumanMessage("My pet will die soon"),
        output: new AIMessage("Don't lose hopes. Miracles happen and your pet will be fine. Is there anything else I can help you with?"),
    },
    {
        input: new HumanMessage("Change my appointment"),
        output: new AIMessage("Sure, which time slot works for you? [available time slots]"),
    },
    {
        input: new HumanMessage("Change"),
        output: new AIMessage("Sorry, I didn't get that. Can you please provide more details?"),
    },
    {
        input: new HumanMessage("Do you know about the weather?"),
        output: new AIMessage("Sorry, I am an agent from [Company Name] to support you through our services. I can help you with our company related queries only."),
    },
    {
        input: new HumanMessage("Sept 6"),
        output: new AIMessage("Sure, There are multiple time slots available for Sept 6. Which time slot works for you? [available time slots]"),
    },
    {
        input: new HumanMessage("10 AM"),
        output: new AIMessage("Seems like there are multiple dates available for 10 AM. Can you please provide the date for which you want to schedule the appointment?"),
    }
]