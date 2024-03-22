import axios from "../utils/apiclient"

export function start(apiKey: string){
    let req = {
        orgName: "ABC Car Wash"
    }
    return axios.post("/chat/start", req, {
        headers:{
            "X-Api-Key": apiKey
        }
    })
}

export function chat(apiKey: string , message: string) {
    let req = {
        orgName: "ABC Car Wash",
        content: message
    }
    return axios.post("/chat", req,{
        headers:{
            "X-Api-Key": apiKey
        }
    })
}