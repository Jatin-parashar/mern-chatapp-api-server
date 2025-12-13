import "./config/envConfig.js"
import logger from "./utils/logger.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import http from "http";

import { cloudinaryConfig } from "./config/cloudinaryConfig.js";
import { connectDB } from "./config/dbConfig.js";
import { initSocketServer, closeSocketServer } from "./socket/socketServer.js";
import routes from "./routes/index.js";
import globalErrorHandler from "./middlewares/error.middleware.js";
import AppError from "./utils/appError.js";
import { PORT } from "./config/envConfig.js";
import { apiLimiter } from "./middlewares/rateLimit.middleware.js";
import { requestLogger } from "./middlewares/requestLogger.middleware.js";

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.fatal({ error: err.message, stack: err.stack }, "UNCAUGHT EXCEPTION! Shutting down...");
  process.exit(1);
});

// Initialize Express app
const app = express();

app.set("trust proxy", 1);

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
    origin: (origin, callback) => {
      const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use(requestLogger);

// Initialize configurations
cloudinaryConfig();
connectDB();

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "ChatApp API - Real-time messaging and video calling service",
    status: "active",
    features: [
      "User authentication & registration",
      "Real-time messaging with Socket.IO",
      "Video & voice calling",
      "File sharing & media uploads",
      "User presence & typing indicators",
      "Conversation management"
    ],
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      conversations: "/api/v1/conversations",
      messages: "/api/v1/messages",
      calls: "/api/v1/calls",
      health: "/api/v1/health"
    }
  });
});

// Routes
app.use("/api/v1", /* apiLimiter, */ routes);

// Handle undefined routes
app.all("/{*any}", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
const io = initSocketServer(server);

// Start server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Graceful shutdown handler
let isShuttingDown = false;
const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  const shutdownTimeout = setTimeout(() => {
    logger.error("Forced shutdown after 30s timeout");
    process.exit(1);
  }, 30000);
  
  try {
    server.close();
    logger.info("HTTP server stopped accepting connections");
    
    await closeSocketServer(io);
    
    const { default: mongoose } = await import("mongoose");
    await mongoose.connection.close();
    logger.info("Database connection closed");
    
    clearTimeout(shutdownTimeout);
    logger.info("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Error during shutdown");
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on("unhandledRejection", (err: Error) => {
  logger.fatal({ error: err.message, stack: err.stack }, "UNHANDLED REJECTION! Shutting down...");
  gracefulShutdown("UNHANDLED_REJECTION");
});

// Handle SIGTERM
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle SIGINT
process.on("SIGINT", () => gracefulShutdown("SIGINT"));