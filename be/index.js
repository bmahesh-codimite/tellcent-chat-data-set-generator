const express = require('express');
const cors = require('cors');
const router = require("./app/routes")
const app = express();

app.use(cors({
    allowedHeaders:["Content-Type","X-API-KEY"],
    origin: process.env.FRONTEND_URL
}))
app.use(express.json());
app.use("/api",router)

app.listen(8080,()=>{
    console.log("Server is running on port 8080")
})