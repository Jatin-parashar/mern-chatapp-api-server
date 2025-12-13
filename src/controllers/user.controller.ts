import { Response } from "express";
import {
  checkUsernameAvailability,
  findAllUsers,
  findUserById,
  searchUsers,
  updateUserStatus,
} from "../services/user.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import { AuthRequest } from "../types/express.js";
import AppError from "../utils/appError.js";
import User from "../models/user.model.js";
import { parsePaginationParams, createPaginationResult } from "../utils/pagination.js";

export const getCurrentUser = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await findUserById(req.user!._id);
  sendSuccessResponse(res, 200, "User fetched successfully", { user });
});

export const getAllUsers = catchAsync(async (req: AuthRequest, res: Response) => {
  const { limit, skip } = parsePaginationParams(
    req.query.limit as string,
    req.query.skip as string
  );

  const [users, total] = await Promise.all([
    findAllUsers(limit, skip),
    User.countDocuments({})
  ]);

  const result = createPaginationResult(users, total, limit, skip);
  sendSuccessResponse(res, 200, "Users fetched successfully", result);
});

export const getuserById = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await findUserById(req.params.id);
  sendSuccessResponse(res, 200, "User fetched successfully", { user });
});

export const searchUsersByKeyword = catchAsync(async (req: AuthRequest, res: Response) => {
  const keyword = req.query.keyword as string;
  const { limit, skip } = parsePaginationParams(
    req.query.limit as string,
    req.query.skip as string
  );

  const { sanitizeRegexInput } = await import("../utils/sanitization.js");
  const sanitizedKeyword = sanitizeRegexInput(keyword);

  const [users, total] = await Promise.all([
    searchUsers(keyword, limit, skip),
    User.countDocuments({
      $or: [
        { name: { $regex: sanitizedKeyword, $options: "i" } },
        { username: { $regex: sanitizedKeyword, $options: "i" } },
      ],
    })
  ]);

  const result = createPaginationResult(users, total, limit, skip);
  sendSuccessResponse(res, 200, "Users fetched successfully", result);
});

export const updateUserInfo = catchAsync(async (req: AuthRequest, res: Response) => {
  const updatedUser = await updateUserStatus(req.user!._id, req.body.status);
  sendSuccessResponse(res, 200, "User updated successfully", { updatedUser });
});

export const checkUsername = catchAsync(async (req: AuthRequest, res: Response) => {
  const { username } = req.params;
  if (!username || typeof username !== 'string') {
    throw new AppError("Username is required", 400);
  }
  
  const available = await checkUsernameAvailability(username);
  sendSuccessResponse(res, 200, "Username availability checked", { available });
});