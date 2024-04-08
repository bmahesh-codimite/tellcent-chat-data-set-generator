import axios from "../utils/apiclient"

export function start(apiKey: string){
    let req = {
        orgName: "Splash Car Wash"
    }
    return axios.post("/chat/start", req, {
        headers:{
            "X-Api-Key": apiKey
        }
    })
}

export function chat(apiKey: string , message: string) {
    let req = {
        orgName: "Splash Car Wash",
        content: message
    }
    return axios.post("/chat", req,{
        headers:{
            "X-Api-Key": apiKey
        }
    })
}

export function saveChat(apiKey: string) {
    return axios.post("/chat/save", {},{
        headers:{
            "X-Api-Key": apiKey
        }
    })
}

export function rateChat(apiKey: string, rating: string) {
    let req = {
        rating: rating
    }
    return axios.post("/chat/rate", req,{
        headers:{
            "X-Api-Key": apiKey
        }
    })
}