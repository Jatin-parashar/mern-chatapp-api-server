import { Response } from "express";
import {
  findAllUsers,
  findUserById,
  searchUsers,
  updateUserStatus,
} from "../services/user.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import { AuthRequest } from "../types/express.js";

export const getCurrentUser = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await findUserById(req.user!._id);
  sendSuccessResponse(res, 200, "User fetched successfully", { user });
});

export const getAllUsers = catchAsync(async (req: AuthRequest, res: Response) => {
  const users = await findAllUsers();
  sendSuccessResponse(res, 200, "Users fetched successfully", { users });
});

export const getuserById = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await findUserById(req.params.id);
  sendSuccessResponse(res, 200, "User fetched successfully", { user });
});

export const searchUsersByKeyword = catchAsync(async (req: AuthRequest, res: Response) => {
  const users = await searchUsers(req.query.keyword as string);
  sendSuccessResponse(res, 200, "Users fetched successfully", { users });
});

export const updateUserInfo = catchAsync(async (req: AuthRequest, res: Response) => {
  const updatedUser = await updateUserStatus(req.user!._id, req.body.status);
  sendSuccessResponse(res, 200, "User updated successfully", { updatedUser });
});
