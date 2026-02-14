import { Router } from "express";
import {
  createConversation,
  getConversationById,
  getUserConversations,
} from "../controllers/conversation.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { createConversationSchema, mongoIdParamSchema } from "../utils/validationSchemas.js";
import { VALIDATION_SOURCES } from "../config/constants.js";

const router = Router();

router.route("/").post(validate(createConversationSchema), createConversation);
router.route("/").get(getUserConversations);
router.route("/:id").get(validate(mongoIdParamSchema, VALIDATION_SOURCES.PARAMS), getConversationById);

export default router;