import { Router } from "express";
import {
  getAllUsers,
  getCurrentUser,
  getuserById,
  searchUsersByKeyword,
  updateUserInfo,
} from "../controllers/user.controller.js"
import { validate } from "../middlewares/validation.middleware.js";
import { updateUserStatusSchema, mongoIdParamSchema } from "../utils/validationSchemas.js";
import { VALIDATION_SOURCES } from "../config/constants.js";

const router = Router();

router.route("/me").get(getCurrentUser);
router.route("/all").get(getAllUsers);
router.route("/search").get(searchUsersByKeyword);
router.route("/:id").get(validate(mongoIdParamSchema, VALIDATION_SOURCES.PARAMS), getuserById);
router.route("/update").patch(validate(updateUserStatusSchema), updateUserInfo);
export default router;

