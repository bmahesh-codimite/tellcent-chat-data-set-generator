import { useEffect, useRef, useState } from 'react'
import db from "./firebase"
import { onValue , ref } from "firebase/database"
import { token } from './services/auth'
import { Button , Input } from "@nextui-org/react"
import { chat, rateChat, saveChat, start } from './services/conversation'
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
	timeSlots?: any
}

function App() {

	const [conversations, setConversations] = useState<Thread>({isProcessing: false, conversation: []})
	const [apiKey , setApiKey] = useState<string | null>(null)
	const [message , setMessage] = useState<string>("")
	const [isStarted, setIsStarted] = useState<boolean>(false)
	const [isSaving , setIsSaving] = useState<boolean>(false)
	const [canSave, setCanSave] = useState<boolean>(false)

	const finalMsgDiv = useRef<HTMLDivElement>(null)
	const textField = useRef<HTMLInputElement>(null)

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
		finalMsgDiv.current?.scrollIntoView({behavior: "smooth"})
		textField.current?.focus()
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

	async function handleRateChat(rate: any){
		// handle rating
		try {
			await rateChat(apiKey as string, rate)
			alert("Thank you for your rating!")
		} catch (error) {
			console.log(error)
		}
	}

	return (
		<div className="container mx-auto grid sm:grid-cols-1 sm:gap-4 lg:grid-cols-2 lg:grid-rows-1 lg:gap-6">
			<div>
				<h1 className="text-4xl font-bold">
					Welcome
				</h1>
				<h4 className="text-2xl font-bold mb-4">
					TellCent chat collection portal!
				</h4>
				<p className='text-md'>
					TellCent is a message-based smart scheduler that uses the power of AI.
					We are working on collecting different chat conversations to fine-tune the TellCent AI model.
					We need all of your valuable support in this. To do so, you have to follow a simple few steps, as mentioned below.
				</p>
				<ol type='1' className="list-decimal list-inside text-md font-bold mt-2 mb-2">
					<li>
						Click on the "Start Chat" button to start the conversation.
					</li>
					<li>
						Continue a conversation in the message flow.
					</li>
					<li>
						Click the "Save Chat" button to save the conversation.
					</li>
				</ol>
				Note:
				<ol type='1' className="list-decimal list-inside text-md font-bold mt-2 mb-2">
					<li>
						The current model follows an appointment scheduling scenario related to a car wash company.
					</li>
					<li>
						But please note that the conversations should not be limited to appointment scheduling; general conversations are also welcome.
					</li>
					<li>
						Please save the chats that you felt better when messaging with the AI model.
					</li>
					<li>
						Also, remember to rate the chat model based on your experience.
					</li>
				</ol>
				{conversations.timeSlots?.length > 0 && (
					<div>
						<h4 className="text-2xl font-bold mb-4">
							Available Time Slots
						</h4>
						{conversations.timeSlots.map((slot: any , index: number)=>{
							return (
								<div key={index} className='bg-blue-200 p-2 my-2 rounded-md'>
									<p>{slot}</p>
								</div>
							)
						})}
					</div>
				)}
			</div>
			<div>
				{!isStarted && 
					<div className='bg-red-200 p-2 my-2 rounded-md'>
						Hello there! Please click on the start chat button to start the conversation	
					</div>
				}
					<div className='max-h-screen overflow-y-auto'>
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
						<div ref={finalMsgDiv}></div>
						{conversations.isProcessing && <Thinking />}
					</div>
					<form onSubmit={handleSubmit}>
						<Input ref={textField} disabled={!isStarted || conversations.isProcessing} className='mt-5' onChange={handleOnMessageChange} value={message} required={true} name='message' placeholder='Type your message' />
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
							<div className='w-full mb-4'>
								<p className='text-center text-md font-bold mt-5'>Rate the chat</p>
								<select onChange={
									(e)=>{
										handleRateChat(e.target.value)
									}
								} className='w-full mt-2 bg-blue-200 p-2 rounded-md'>
									<option selected disabled value="">Select a rating</option>
									<option value='1'>1</option>
									<option value='2'>2</option>
									<option value='3'>3</option>
									<option value='4'>4</option>
									<option value='5'>5</option>
								</select>
							</div>
						</div>
					</form>
			</div>
		</div>
	)
}

export default App
