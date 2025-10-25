import "./config/envConfig.js"
import logger from "./utils/logger.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import http from "http";

import { cloudinaryConfig } from "./config/cloudinaryConfig.js";
import { connectDB } from "./config/dbConfig.js";
import { initSocketServer } from "./socket/socketServer.js";
import routes from "./routes/index.js";
import globalErrorHandler from "./middlewares/error.middleware.js";
import AppError from "./utils/appError.js";
import { PORT } from "./config/envConfig.js";
import { apiLimiter } from "./middlewares/rateLimit.middleware.js";

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.fatal(err, "UNCAUGHT EXCEPTION! Shutting down...");
  process.exit(1);
});

// Initialize Express app
const app = express();

// Security & Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "same-origin" }
}));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Initialize configurations
cloudinaryConfig();
connectDB();

// Routes
app.use("/api/v1",apiLimiter, routes);

// Handle undefined routes
app.all("/{*any}", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
initSocketServer(server);

// Start server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  logger.fatal(err, "UNHANDLED REJECTION! Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on("SIGTERM", () => {
  logger.info("SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated!");
  });
});