import { Request, Response } from "express";
import { NODE_ENV } from "../config/envConfig.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import mongoose from "mongoose";
import { SUCCESS_MESSAGES } from "../config/constants.js";

export const healthCheck = catchAsync(async (_req: Request, res: Response) => {
  const healthData = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    environment: NODE_ENV
  };

  sendSuccessResponse(res, 200, SUCCESS_MESSAGES.HEALTH_CHECK, healthData);
});