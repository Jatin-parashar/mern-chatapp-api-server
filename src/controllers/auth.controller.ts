import { Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { sendSuccessResponse } from "../utils/response.js";
import { validateRefreshToken, createAccessToken } from "../utils/auth.js";
import { createTokenPair } from "../utils/authHelpers.js";
import { createUser, loginUser } from "../services/auth.service.js";
import { JwtPayload } from "jsonwebtoken";
import { AuthFileRequest } from "../types/express.js";
import { SUCCESS_MESSAGES, AUTH_ERROR_MESSAGES } from "../config/constants.js";

export const register = catchAsync(
  async (req: AuthFileRequest, res: Response) => {
    const { name, email, username, password, status } = req.body;
    const profilePic = req.file?.path;

    const createdUser = await createUser(
      name,
      email,
      username,
      password,
      status,
      profilePic
    );

    const { accessToken, refreshToken } = createTokenPair(createdUser);

    sendSuccessResponse(res, 201, SUCCESS_MESSAGES.USER_CREATED, {
      user: createdUser,
      accessToken,
      refreshToken,
    });
  }
);

export const login = catchAsync(async (req: AuthFileRequest, res: Response) => {
  const { email, password } = req.body;

  const authenticatedUser = await loginUser(email, password);

  const { accessToken, refreshToken } = createTokenPair(authenticatedUser);

  sendSuccessResponse(res, 200, SUCCESS_MESSAGES.USER_LOGGED_IN, {
    user: authenticatedUser,
    accessToken,
    refreshToken,
  });
});

export const logout = (_req: AuthFileRequest, res: Response): void => {
  sendSuccessResponse(res, 200, SUCCESS_MESSAGES.LOGGED_OUT);
};

export const refreshToken = catchAsync(
  async (req: AuthFileRequest, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError(AUTH_ERROR_MESSAGES.NO_REFRESH_TOKEN, 401);

    try {
      const authenticatedUser = validateRefreshToken(refreshToken) as JwtPayload;

      const user = {
        email: authenticatedUser.email,
        _id: authenticatedUser._id,
      };

      const accessToken = createAccessToken(user);

      sendSuccessResponse(res, 200, SUCCESS_MESSAGES.TOKEN_REFRESHED, {
        user: authenticatedUser,
        accessToken,
      });
    } catch (error) {
      throw new AppError(AUTH_ERROR_MESSAGES.INVALID_REFRESH_TOKEN, 401);
    }
  }
);
