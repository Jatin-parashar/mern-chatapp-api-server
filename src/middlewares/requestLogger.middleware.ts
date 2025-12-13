import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import logger from "../utils/logger.js";
import { AuthRequest } from "../types/express.js";

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate unique request ID
  req.requestId = randomUUID();
  req.startTime = Date.now();

  // Log incoming request
  const authReq = req as AuthRequest;
  logger.info({
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
    userId: authReq.user?._id,
  }, `Incoming ${req.method} ${req.path}`);

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    res.send = originalSend;
    
    const responseTime = Date.now() - (req.startTime || Date.now());
    const logLevel = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[logLevel]({
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: authReq.user?._id,
    }, `Completed ${req.method} ${req.path} - ${res.statusCode} (${responseTime}ms)`);

    return originalSend.call(this, data);
  };

  next();
};

export const getRequestId = (req: Request): string => {
  return req.requestId || 'unknown';
};