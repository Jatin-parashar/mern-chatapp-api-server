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
import { validate } from "../middlewares/validation.middleware.js";
import { sendMessageSchema, mongoIdParamSchema } from "../utils/validationSchemas.js";
import { VALIDATION_SOURCES } from "../config/constants.js";

const router = Router();

router.route("/").post(
  upload.array("files", 10), 
  validate(sendMessageSchema),
  processUploadedFiles, 
  sendMessage
);

router.route("/conversation/:id").get(validate(mongoIdParamSchema, VALIDATION_SOURCES.PARAMS), getMessagesByConversation);
router.route("/conversation/:id/cursor").get(validate(mongoIdParamSchema, VALIDATION_SOURCES.PARAMS), getMessagesByCursor);
router.route("/seen/conversation/:id").patch(validate(mongoIdParamSchema, VALIDATION_SOURCES.PARAMS), markConversationMessagesSeen);
router.route("/seen/:id").patch(validate(mongoIdParamSchema, VALIDATION_SOURCES.PARAMS), markMessageSeen);

export default router;