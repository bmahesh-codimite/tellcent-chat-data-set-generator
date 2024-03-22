import { useEffect, useState } from 'react'
import db from "./firebase"
import { onValue , ref } from "firebase/database"
import { token } from './services/auth'
import { Button , Input } from "@nextui-org/react"
import { chat, start } from './services/conversation'

type Conversation = {
	type: string
	timestamp: string
	content: string
	category: number | undefined
}

function App() {

	const [conversations, setConversations] = useState<Conversation[]>([])
	const [apiKey , setApiKey] = useState<string | null>(null)

	useEffect(()=>{
		// if token is not there first get the token then listen to the conversation
		if(apiKey === null){
			getToken()
		} else {
			const conversationsRef = ref(db, `conversations/${apiKey}`)
			return onValue(conversationsRef, (snapShot)=>{
				if (snapShot.exists()){
					console.log("Conversations",JSON.stringify(snapShot.val()))
					console.log("Val",snapShot.val())
					setConversations(snapShot.val())
				}
			})
		}
	},[apiKey])

	async function handleStartChat(_e: any){
		try {
			let res = await start(apiKey as string)
			console.log(res.data)
		} catch (error) {
			console.log(error)
		}
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
		try {
			let res = await chat(apiKey as string, e.target.message.value)
			console.log(res.data)
		} catch (error) {
			console.log(error)
		}
	}

	return (
		<div className='container px-4'>
			<div className='grid grid-cols-2'>
				<div>
					<Button onClick={handleStartChat} >Start Chat</Button>
				</div>
				<div>
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
						<Input required name='message' placeholder='Type your message' />
						<Button className='mt-5' type='submit' color="secondary">
							Send
						</Button>
					</form>
				</div>
			</div>
		</div>
	)
}

export default App
