import rateLimit from "express-rate-limit";
import { RequestHandler } from "express";
import { NODE_ENV } from "../config/envConfig.js";
import { RATE_LIMITS } from "../config/constants.js";

const isProduction = NODE_ENV === "production";

const createLimiter = (windowMs: number, max: number, message: string): RequestHandler => {
  if (!isProduction) return (_req, _res, next) => next();

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: false, // failed attempts count against the limit
    message: { status: "fail", message },
  });
};

// Strictest — brute force protection on login
export const loginLimiter = createLimiter(
  RATE_LIMITS.LOGIN.WINDOW_MS,
  RATE_LIMITS.LOGIN.MAX,
  "Too many login attempts, please try again after 15 minutes"
);

// register, refreshToken, check-username
export const authLimiter = createLimiter(
  RATE_LIMITS.AUTH.WINDOW_MS,
  RATE_LIMITS.AUTH.MAX,
  "Too many attempts, please try again after 15 minutes"
);

export const apiLimiter = createLimiter(
  RATE_LIMITS.API.WINDOW_MS,
  RATE_LIMITS.API.MAX,
  "Too many requests, please slow down"
);

export const messageLimiter = createLimiter(
  RATE_LIMITS.MESSAGE.WINDOW_MS,
  RATE_LIMITS.MESSAGE.MAX,
  "Too many messages, please slow down"
);
