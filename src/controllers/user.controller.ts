import { Response } from "express";
import {
  findAllUsers,
  findUserById,
  searchUsers,
  updateUserStatus,
} from "../services/user.service.js";
import catchAsync from "../utils/catchAsync.js";
import { AuthRequest } from "../types/express.js";

export const getCurrentUser = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await findUserById(req.user!._id);
  res.status(200).json({
    status: "success",
    message: "User fetched successfully",
    user,
  });
});

export const getAllUsers = catchAsync(async (req: AuthRequest, res: Response) => {
  const users = await findAllUsers();
  res.status(200).json({
    status: "success",
    message: "Users fetched successfully",
    users,
  });
});

export const getuserById = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await findUserById(req.params.id);
  res.status(200).json({
    status: "success",
    message: "User fetched successfully",
    user,
  });
});

export const searchUsersByKeyword = catchAsync(async (req: AuthRequest, res: Response) => {
  const users = await searchUsers(req.query.keyword as string);
  res.status(200).json({
    status: "success",
    message: "Users fetched successfully",
    users,
  });
});

export const updateUserInfo = catchAsync(async (req: AuthRequest, res: Response) => {
  const updatedUser = await updateUserStatus(req.user!._id, req.body.status);
  res.status(200).json({
    status: "success",
    message: "User updated successfully",
    updatedUser,
  });
});
