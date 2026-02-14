import { Router } from "express";
import {
  login,
  logout,
  refreshToken,
  register,
} from "../controllers/auth.controller.js";
import { checkUsername } from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { uploadProfile } from "../config/cloudinaryConfig.js";
import { validate } from "../middlewares/validation.middleware.js";
import { registerSchema, loginSchema, refreshTokenSchema } from "../utils/validationSchemas.js";
import { FORM_FIELDS } from "../config/constants.js";

const router = Router();

router
  .route("/register")
  .post(uploadProfile.single(FORM_FIELDS.PROFILE_PIC), validate(registerSchema), register);
router.route("/login").post(validate(loginSchema), login);
router.route("/logout").post(authMiddleware, logout);
router.route("/refreshToken").post(validate(refreshTokenSchema), refreshToken);
router.route("/check-username/:username").get(checkUsername);

export default router;
