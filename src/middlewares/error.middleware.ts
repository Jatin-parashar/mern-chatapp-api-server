import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError.js";
import logger from "../utils/logger.js";
import { AuthRequest } from "../types/express.js";

interface MongoError extends Error {
  path?: string;
  value?: any;
  code?: number;
  errorResponse?: {
    errmsg?: string;
  };
  errors?: any;
}

const handleCastErrorDB = (err: MongoError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: MongoError): AppError => {
  const value =
    err?.errorResponse?.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0] || "Unknown";

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: MongoError): AppError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = (): AppError =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = (): AppError =>
  new AppError("Your token has expired! Please log in again.", 401);

const sendErrorDev = (err: AppError, req: Request, res: Response): void => {
  const authReq = req as AuthRequest;
  
  logger.error({
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    userId: authReq.user?._id,
  }, `Development Error: ${err.message}`);
  
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    requestId: req.requestId,
  });
};

const sendErrorProd = (err: AppError, req: Request, res: Response): void => {
  const authReq = req as AuthRequest;
  
  // Operational Error: Send message to client
  if (err.isOperational) {
    logger.warn({
      requestId: req.requestId,
      error: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      userId: authReq.user?._id,
    }, `Operational Error: ${err.message}`);
    
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      requestId: req.requestId,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error({
      requestId: req.requestId,
      error: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      userId: authReq.user?._id,
      name: err.name,
    }, `Programming/Unknown Error: ${err.message}`);
    
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
      requestId: req.requestId,
    });
  }
};

export default (err: any, req: Request, res: Response, next: NextFunction): void => {
  if (typeof err === "string") {
    err = new AppError(err, 500);
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  const env = process.env.NODE_ENV?.toLowerCase() || "development";

  if (env === "development") {
    sendErrorDev(err, req, res);
  } else if (env === "production") {
    let error = Object.create(err);
    error.message = err.message;
    error.name = err.name;
    error.statusCode = err.statusCode || 500;
    error.status = err.status || "error";
    error.code = err.code;
    error.isOperational = err.isOperational;

    // Handle specific error types
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError") error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  } else {
    // Fallback for unknown environment
    sendErrorDev(err, req, res);
  }
};