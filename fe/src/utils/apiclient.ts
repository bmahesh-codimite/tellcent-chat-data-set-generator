import axios from "axios";

axios.defaults.baseURL = `${import.meta.env.VITE_BASE_URI}/api/`;
axios.defaults.headers.common["X-API-KEY"] = localStorage.getItem("token")

export default axios;