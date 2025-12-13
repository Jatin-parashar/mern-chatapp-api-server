import { Router } from "express";
import {
  login,
  logout,
  refreshToken,
  register,
} from "../controllers/auth.controller.js";
import { checkUsername } from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { upload } from "../config/cloudinaryConfig.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router
  .route("/register")
  .post(/* authLimiter, */ upload.single("profilePic"), register);
router.route("/login").post(/* authLimiter, */ login);
router.route("/logout").post(authMiddleware, logout);
router.route("/refreshToken").post(refreshToken);
router.route("/check-username/:username").get(checkUsername);

export default router;
