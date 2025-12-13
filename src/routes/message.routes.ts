import { Router } from "express";
import {
  getMessagesByConversation,
  getMessagesByCursor,
  markConversationMessagesSeen,
  sendMessage,
  markMessageSeen
} from "../controllers/message.controller.js";
import { upload } from "../config/cloudinaryConfig.js";
import { processUploadedFiles } from "../middlewares/upload.middleware.js";
import { messageLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.route("/").post(
  /* messageLimiter, */
  upload.array("files", 10), 
  processUploadedFiles, 
  sendMessage
);

router.route("/conversation/:id").get(getMessagesByConversation);
router.route("/conversation/:id/cursor").get(getMessagesByCursor);
router.route("/seen/conversation/:id").patch(markConversationMessagesSeen);
router.route("/seen/:id").patch(markMessageSeen);

export default router;