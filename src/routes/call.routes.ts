import { Router } from "express";
import { getCallHistory, getCallById } from "../controllers/call.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { callIdParamSchema } from "../utils/validationSchemas.js";
import { VALIDATION_SOURCES } from "../config/constants.js";

const router = Router();

router.route("/history").get(getCallHistory);
router.route("/:callId").get(validate(callIdParamSchema, VALIDATION_SOURCES.PARAMS), getCallById);

export default router;