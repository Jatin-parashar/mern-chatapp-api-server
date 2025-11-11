import { Router } from "express";
import {
  checkUsername,
  getAllUsers,
  getCurrentUser,
  getuserById,
  searchUsersByKeyword,
  updateUserInfo,
} from "../controllers/user.controller.js"
const router = Router();

router.route("/me").get(getCurrentUser);
router.route("/all").get(getAllUsers);
router.route("/search").get(searchUsersByKeyword); // add search param as keywprd=
router.route("/check-username").get(checkUsername);
router.route("/:id").get(getuserById);
router.route("/update").patch(updateUserInfo);
export default router;

