import { Response } from "express";
import {
  checkUsernameAvailability,
  findUserById,
  updateUserStatus,
} from "../services/user.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import { AuthRequest } from "../types/express.js";
import AppError from "../utils/appError.js";
import User from "../models/user.model.js";
import { buildPaginatedQuery } from "../utils/queryBuilder.js";
import { sanitizeRegexInput } from "../utils/sanitization.js";
import { QUERY_OPTIONS, SUCCESS_MESSAGES, AUTH_ERROR_MESSAGES } from "../config/constants.js";

export const getCurrentUser = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await findUserById(req.user!._id);
  sendSuccessResponse(res, 200, SUCCESS_MESSAGES.USER_FETCHED, { user });
});

export const getAllUsers = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await buildPaginatedQuery(User, req.query, {
    lean: true,
    select: '_id name username profilePic status',
  });
  sendSuccessResponse(res, 200, SUCCESS_MESSAGES.USERS_FETCHED, result);
});

export const getuserById = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await findUserById(req.params.id);
  sendSuccessResponse(res, 200, SUCCESS_MESSAGES.USER_FETCHED, { user });
});

export const searchUsersByKeyword = catchAsync(async (req: AuthRequest, res: Response) => {
  const keyword = (req.query.keyword as string)?.trim();

  if (!keyword) {
    return sendSuccessResponse(res, 200, SUCCESS_MESSAGES.USERS_FETCHED, { data: [], total: 0, count: 0, hasMore: false });
  }

  const sanitizedKeyword = sanitizeRegexInput(keyword);

  const filter = {
    $or: [
      { name: { $regex: sanitizedKeyword, $options: QUERY_OPTIONS.CASE_INSENSITIVE } },
      { username: { $regex: sanitizedKeyword, $options: QUERY_OPTIONS.CASE_INSENSITIVE } },
    ],
  };

  const result = await buildPaginatedQuery(User, req.query, {
    filter,
    lean: true,
    select: '_id name username profilePic status',
  });
  sendSuccessResponse(res, 200, SUCCESS_MESSAGES.USERS_FETCHED, result);
});

export const updateUserInfo = catchAsync(async (req: AuthRequest, res: Response) => {
  const updatedUser = await updateUserStatus(req.user!._id, req.body.status);
  sendSuccessResponse(res, 200, SUCCESS_MESSAGES.USER_UPDATED, { updatedUser });
});

export const checkUsername = catchAsync(async (req: AuthRequest, res: Response) => {
  const { username } = req.params;
  if (!username || typeof username !== 'string') {
    throw new AppError(AUTH_ERROR_MESSAGES.USERNAME_REQUIRED, 400);
  }
  
  const available = await checkUsernameAvailability(username);
  sendSuccessResponse(res, 200, SUCCESS_MESSAGES.USERNAME_CHECKED, { available });
});