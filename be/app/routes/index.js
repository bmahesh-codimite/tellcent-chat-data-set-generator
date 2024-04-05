const express = require('express');
const { getToken } = require("../services/auth");
const { startChat, chat, saveChatID , rateChat } = require('../services/chat');

const AuthRouter = express.Router();

AuthRouter.get("/token",getToken)

const ChatRouter = express.Router();

ChatRouter.post("/start",startChat)
ChatRouter.post("/",chat)
ChatRouter.post("/save",saveChatID)
ChatRouter.post("/rate",rateChat)

const BaseRouter = express.Router();

BaseRouter.use("/auth",AuthRouter)
BaseRouter.use("/chat",ChatRouter)

module.exports = BaseRouter