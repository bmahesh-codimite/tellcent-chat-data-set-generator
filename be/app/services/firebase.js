const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set , onValue , get } = require('firebase/database');

const firebaseConfig = {
    apiKey: "AIzaSyAtJKppJwbAQauaK8spKs74ETigxgKbqqE",
    authDomain: "connectx-qa.firebaseapp.com",
    databaseURL: "https://connectx-qa-default-rtdb.firebaseio.com",
    projectId: "connectx-qa",
    storageBucket: "connectx-qa.appspot.com",
    messagingSenderId: "115184171987",
    appId: "1:115184171987:web:c4c173e441d8150b0e8d26",
};

const app = initializeApp(firebaseConfig);

async function setValue(conversationID , conversationOBJ , isProcessing = false){
    const db = getDatabase(app);
    let conversationRef = ref(db, `conversations/${conversationID}`);
    let snapShot = await get(conversationRef);
    if(snapShot.exists()){
        let data = snapShot.val();
        data.isProcessing = isProcessing;
        data.conversation.push(conversationOBJ);
        await set(conversationRef,data)
        return
    }
    await set(conversationRef,{conversation: conversationOBJ , isProcessing: isProcessing}); // Time to create a new conversation. conversationOBJ is an array of messages
    return
}

async function saveChatID(conversationID){
    const db = getDatabase(app);
    let savedConversationsRef = ref(db, `savedConversations`);
    let snapShot = await get(savedConversationsRef);
    if(snapShot.exists()){
        let data = snapShot.val();
        data = {
            ...data,
            [conversationID]: new Date().toISOString()
        }
        return set(savedConversationsRef,data)
    }
    return set(savedConversationsRef,{[conversationID]: new Date().toISOString()})
}

async function getValue(conversationID){
    try {
        const db = getDatabase(app);
        let conversationRef = ref(db, `conversations/${conversationID}`);
        let snapShot = await get(conversationRef);
        if(snapShot.exists()){
            return snapShot.val();
        }
        throw new Error("Conversation not found")
    } catch (error) {
        throw error
    }
}

// setValue("bb6629478f291ae158a0be4085d83476",{message:"Hello",sender:"user"}).then(console.log).catch(console.error)

module.exports = {
    setValue,
    getValue,
    saveChatID
}