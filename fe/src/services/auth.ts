import Auth from "../types/auth"
import axios from "../utils/apiclient"

export async function token(){
    try {
        const response = await axios.get('/auth/token')
        return response.data as Auth
    } catch (error) {
        throw error
    }
}