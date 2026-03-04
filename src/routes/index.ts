import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import conversationRoutes from "./conversation.routes.js";
import messageRoutes from "./message.routes.js";
import callRoutes from "./call.routes.js";
import healthRoutes from "./health.routes.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { apiLimiter, messageLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/user", apiLimiter, authMiddleware, userRoutes);
router.use("/conversation", apiLimiter, authMiddleware, conversationRoutes);
router.use("/message", messageLimiter, authMiddleware, messageRoutes);
router.use("/call", apiLimiter, authMiddleware, callRoutes);

export default router;