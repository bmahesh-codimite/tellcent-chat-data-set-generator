import { useEffect, useState } from 'react'
import db from "./firebase"
import { onValue , ref } from "firebase/database"
import { token } from './services/auth'
import { Button , Input } from "@nextui-org/react"
import { chat, saveChat, start } from './services/conversation'

type Conversation = {
	type: string
	timestamp: string
	content: string
	category: number | undefined
}

function App() {

	const [conversations, setConversations] = useState<Conversation[]>([])
	const [apiKey , setApiKey] = useState<string | null>(null)
	const [message , setMessage] = useState<string>("")
	const [isStarted, setIsStarted] = useState<boolean>(false)
	const [isSaving , setIsSaving] = useState<boolean>(false)
	const [canSave, setCanSave] = useState<boolean>(false)
	const [saved, setSaved] = useState<boolean>(false)

	useEffect(()=>{
		// if token is not there first get the token then listen to the conversation
		if(apiKey === null){
			getToken()
		} else {
			const conversationsRef = ref(db, `conversations/${apiKey}`)
			return onValue(conversationsRef, (snapShot)=>{
				if (snapShot.exists()){
					setConversations(snapShot.val())
				}
			})
		}
	},[apiKey])

	useEffect(()=>{
		if(conversations.length > 3){
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
			setSaved(true)
		} catch (error) {
			console.log(error)
		}
	}

	return (
		<div className='md:container px-4'>
			{!isStarted && 
			<div className='bg-red-200 p-2 my-2 rounded-md'>
				Hello there! Please click on the start chat button to start the conversation	
			</div>}
			{conversations.map((conv, index) => {
				switch (conv.category) {
					case 200:
						return null
					default:
						if(conv.content !== ""){
							if (conv?.type === "AI") {
								return (
									<div key={index} className='bg-gray-200 p-2 my-2 rounded-md'>
										<p>{conv?.content}</p>
										<p className='text-indigo-500'>{conv?.type}</p>
									</div>
								)
							}else if (conv?.type === "System"){
								return null 
							}else{
								return (
									<div key={index} className='bg-blue-200 p-2 my-2 rounded-md'>
										<p>{conv?.content}</p>
										<p className='text-indigo-500'>{conv?.type}</p>
									</div>
								)
							}
						}else{
							return null
						}
				}
			})}
			<form onSubmit={handleSubmit}>
				<Input disabled={!isStarted} className='mt-5' onChange={handleOnMessageChange} value={message} required={true} name='message' placeholder='Type your message' />
				<div className='md:grid grid-cols-2 gap-2'>
					<Button disabled={!isStarted} className='bg-fuchsia-500 mt-5 text-white' type='submit'>
						Send
					</Button>
					{!isStarted &&
						<Button onClick={handleStartChat} className={'mt-5 bg-yellow-500 text-white'} >Start Chat</Button>
					}
					{(isStarted && !saved) && <Button isLoading={isSaving} disabled={!canSave} onClick={handleSaveChat} className={'mt-5 bg-indigo-400 text-white'} >Save Chat</Button>}
				</div>
			</form>
		</div>
	)
}

export default App
