import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import conversationRoutes from "./conversation.routes.js";
import messageRoutes from "./message.routes.js";
import callRoutes from "./call.routes.js";
import healthRoutes from "./health.routes.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/user", authMiddleware, userRoutes);
router.use("/conversation", authMiddleware, conversationRoutes);
router.use("/message", authMiddleware, messageRoutes);
router.use("/call", authMiddleware, callRoutes);

export default router;