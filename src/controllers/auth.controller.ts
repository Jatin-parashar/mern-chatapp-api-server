import { Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { sendSuccessResponse } from "../utils/response.js";
import {
  createAccessToken,
  createRefreshToken,
  validateRefreshToken,
} from "../utils/auth.js";
import { createUser, loginUser } from "../services/auth.service.js";
import { JwtPayload } from "jsonwebtoken";
import { AuthFileRequest } from "../types/express.js";

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

    const accessToken = createAccessToken(createdUser);
    const refreshToken = createRefreshToken(createdUser);

    sendSuccessResponse(res, 201, "User created successfully", {
      user: createdUser,
      accessToken,
      refreshToken,
    });
  }
);

export const login = catchAsync(async (req: AuthFileRequest, res: Response) => {
  const { email, password } = req.body;

  const authenticatedUser = await loginUser(email, password);

  const accessToken = createAccessToken(authenticatedUser);
  const refreshToken = createRefreshToken(authenticatedUser);

  sendSuccessResponse(res, 200, "User logged in", {
    user: authenticatedUser,
    accessToken,
    refreshToken,
  });
});

export const logout = (req: AuthFileRequest, res: Response): void => {
  sendSuccessResponse(res, 200, "Logged out");
};

export const refreshToken = catchAsync(
  async (req: AuthFileRequest, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError("No Refresh Token", 401);

    const authenticatedUser = validateRefreshToken(refreshToken) as JwtPayload;

    const user = {
      email: authenticatedUser.email,
      _id: authenticatedUser._id,
    };

    const accessToken = createAccessToken(user);

    sendSuccessResponse(res, 200, "Token refreshed successfully", {
      user: authenticatedUser,
      accessToken,
    });
  }
);
