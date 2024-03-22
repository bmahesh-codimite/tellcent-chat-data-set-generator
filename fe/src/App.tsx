import { useEffect, useState } from 'react'
import db from "./firebase"
import { onValue , ref } from "firebase/database"
import { token } from './services/auth'
import { Button , Input } from "@nextui-org/react"
import { chat, saveChat, start } from './services/conversation'
import Thinking from './components/Thinking'

type Message = {
	type: string
	timestamp: string
	content: string
	category: number | undefined
}

type Thread = {
	isProcessing: boolean
	conversation: Message[]
}

function App() {

	const [conversations, setConversations] = useState<Thread>({isProcessing: false, conversation: []})
	const [apiKey , setApiKey] = useState<string | null>(null)
	const [message , setMessage] = useState<string>("")
	const [isStarted, setIsStarted] = useState<boolean>(false)
	const [isSaving , setIsSaving] = useState<boolean>(false)
	const [canSave, setCanSave] = useState<boolean>(false)

	useEffect(()=>{
		// if token is not there first get the token then listen to the conversation
		if(apiKey === null){
			getToken()
		} else {
			const conversationsRef = ref(db, `conversations/${apiKey}`)
			return onValue(conversationsRef, (snapShot)=>{
				if (snapShot.exists()){
					console.log(snapShot.val())
					setConversations(snapShot.val())
				}
			})
		}
	},[apiKey])

	useEffect(()=>{
		if(conversations.conversation.length > 3){
			setCanSave(true)
		}
	},[conversations])

	async function handleStartChat(_e: any){
		try {
			setIsStarted(true)
			let res = await start(apiKey as string)
			console.log(res.data)
		} catch (error) {
			console.log(error)
		}
	}

	function handleOnMessageChange(e: any){
		setMessage(e.target.value)
	}

	async function getToken(){
		try {
			let tokenRes = await token()
			setApiKey(tokenRes.token)
		} catch (error) {
			console.log(error)
		}
	}

	async function handleSubmit(e: any){
		e.preventDefault()
		if (message === ""){
			alert("Please type a message")
			return
		}
		try {
			let res = await chat(apiKey as string, message)
			setMessage("")
			console.log(res.data)
		} catch (error) {
			console.log(error)
		}
	}

	async function handleSaveChat(){
		try {
			setIsSaving(true)
			await saveChat(apiKey as string)
			alert("Thank you for your support!")
			setIsSaving(false)
		} catch (error) {
			console.log(error)
		}
	}

	return (
		<div className='container flex justify-center w-full mx-auto'>
			<div className='md:w-1/2 sm:w-4/5'>
				{!isStarted && 
					<div className='bg-red-200 p-2 my-2 rounded-md'>
						Hello there! Please click on the start chat button to start the conversation	
					</div>}
				{conversations.conversation.map((conv, index) => {
					switch (conv.category) {
						case 200:
							return null
						default:
							if(conv.content !== ""){
								if (conv?.type === "AI") {
									return (
										<div key={index} className='bg-gray-200 p-2 my-2 rounded-md'>
											<p>{conv?.content}</p>
											<p className='text-indigo-500'>
												Agent
											</p>
										</div>
									)
								}else if (conv?.type === "System"){
									return null 
								}else{
									return (
										<div key={index} className='bg-blue-200 p-2 my-2 rounded-md'>
											<p>{conv?.content}</p>
											<p className='text-indigo-500'>
												You
											</p>
										</div>
									)
								}
							}else{
								return null
							}
					}
				})}
				
				{conversations.isProcessing && <Thinking />}
				<form onSubmit={handleSubmit}>
					<Input disabled={!isStarted || conversations.isProcessing} className='mt-5' onChange={handleOnMessageChange} value={message} required={true} name='message' placeholder='Type your message' />
					<div className='columns-2 columns-xs w-full bg-blue'>
						<div className='w-full'>
							<Button disabled={!isStarted || conversations.isProcessing} className='bg-fuchsia-500 mt-5 text-white w-full' type='submit'>
								{conversations.isProcessing ? "Wait..." : "Send"}
							</Button>
						</div>
						<div className='w-full'>
							{!isStarted &&
								<Button onClick={handleStartChat} className={'mt-5 bg-yellow-500 text-white w-full'} >Start Chat</Button>
							}
							{(isStarted) && <Button isLoading={isSaving} disabled={!canSave} onClick={handleSaveChat} className={'mt-5 bg-indigo-400 text-white w-full'} >Save Chat</Button>}
						</div>
					</div>
				</form>
			</div>
		</div>
	)
}

export default App
