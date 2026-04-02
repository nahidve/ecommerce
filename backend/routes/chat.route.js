import express from "express";
import { generateChatResponse } from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/chat", generateChatResponse);

export default router;