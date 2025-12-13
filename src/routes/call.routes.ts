import { Router } from "express";
import { getCallHistory, getCallById } from "../controllers/call.controller.js";

const router = Router();

router.route("/history").get(getCallHistory);
router.route("/:callId").get(getCallById);

export default router;