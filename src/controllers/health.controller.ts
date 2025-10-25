import { Request, Response } from "express";
import { NODE_ENV } from "../config/envConfig.js";
import catchAsync from "../utils/catchAsync.js";
import mongoose from "mongoose";

export const healthCheck = catchAsync(async (req: Request, res: Response) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    environment: NODE_ENV
  };

  res.status(200).json(healthCheck);
});