import { NextFunction, Response } from "express";
import AppError from "../utils/appError.js";
import { validateAccessToken } from "../utils/auth.js";
import { AuthRequest } from "../types/express.js";
import { HTTP_MESSAGES, HTTP_METHODS, AUTH_CONSTANTS } from "../config/constants.js";

export default (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (req.method === HTTP_METHODS.OPTIONS) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    throw new AppError(HTTP_MESSAGES.AUTH.MISSING_HEADER, 401);
  }

  if (!authHeader.startsWith(AUTH_CONSTANTS.BEARER_PREFIX)) {
    throw new AppError(HTTP_MESSAGES.AUTH.INVALID_HEADER_FORMAT, 401);
  }

  const accessToken = authHeader.substring(AUTH_CONSTANTS.BEARER_PREFIX_LENGTH);
  
  if (!accessToken) {
    throw new AppError(HTTP_MESSAGES.AUTH.TOKEN_NOT_PROVIDED, 401);
  }

  try {
    const decoded = validateAccessToken(accessToken);
    
    if (typeof decoded === 'string' || !decoded._id || !decoded.email) {
      throw new AppError(HTTP_MESSAGES.AUTH.INVALID_PAYLOAD, 401);
    }
    
    req.user = {
      _id: decoded._id,
      email: decoded.email
    };
    
    next();
  } catch (error: any) {
    if (error.name === AUTH_CONSTANTS.TOKEN_ERROR_EXPIRED) {
      throw new AppError(HTTP_MESSAGES.AUTH.TOKEN_EXPIRED, 401);
    }
    if (error.name === AUTH_CONSTANTS.TOKEN_ERROR_INVALID) {
      throw new AppError(HTTP_MESSAGES.AUTH.INVALID_TOKEN, 401);
    }
    throw new AppError(HTTP_MESSAGES.AUTH.AUTH_FAILED, 401);
  }
};
