import { Router } from "express";
import {
  getMessagesByConversation,
  markConversationMessagesSeen,
  sendMessage,
  markMessageSeen
} from "../controllers/message.controller.js";
import { upload } from "../config/cloudinaryConfig.js";
import { processUploadedFiles } from "../middlewares/upload.middleware.js";
import { messageLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

// Send message (with optional file attachments)
router.route("/").post(
  messageLimiter,
  upload.array("files", 10), 
  processUploadedFiles, 
  sendMessage
);

// Get messages for a conversation with pagination
router.route("/conversation/:id").get(getMessagesByConversation);

// Mark all messages in conversation as seen
router.route("/seen/conversation/:id").patch(markConversationMessagesSeen);

// Mark specific message as seen
router.route("/seen/:id").patch(markMessageSeen);

export default router;