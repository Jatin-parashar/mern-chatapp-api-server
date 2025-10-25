import { Router } from "express";
import { getCallHistory, getCallById } from "../controllers/call.controller.js";

const router = Router();

// Get user's call history
router.route("/history").get(getCallHistory);

// Get specific call details
router.route("/:callId").get(getCallById);

export default router;