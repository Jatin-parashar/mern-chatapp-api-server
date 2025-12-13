import { Router } from "express";
import {
  createConversation,
  getConversationById,
  getUserConversations,
} from "../controllers/conversation.controller.js";

const router = Router();

router.route("/").post(createConversation);
router.route("/").get(getUserConversations);
router.route("/:id").get(getConversationById);

export default router;