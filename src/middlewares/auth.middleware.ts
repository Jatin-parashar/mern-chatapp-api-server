import { NextFunction, Response } from "express";
import AppError from "../utils/appError.js";
import { validateAccessToken } from "../utils/auth.js";
import { JwtPayload } from "jsonwebtoken";
import { AuthRequest } from "../types/express.js";

export default (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  if (!req.headers.authorization) {
    throw new AppError("Missing Auth Header in the request", 401);
  }

  const authFragments = req.headers.authorization.split(" ");

  if (authFragments.length !== 2) {
    throw new AppError("Invalid Auth Header in the request", 401);
  }

  const accessToken = authFragments[1];
  try {
    const user = validateAccessToken(accessToken) as JwtPayload;
    req.user = {
      _id: user._id,
      email: user.email
    }
    next();
  } catch (error) {
    throw new AppError("Invalid Token", 401);
  }
};
