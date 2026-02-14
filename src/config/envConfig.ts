import dotenv from "dotenv";
dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || "development";

// Logger can be imported after NODE_ENV is available
import logger from "../utils/logger.js";

const requiredSensitiveVars = [
  "ACCESS_JWT_SECRET",
  "REFRESH_JWT_SECRET",
  "DATABASE_URI",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

// Validate required variables
const missingVars: string[] = [];
requiredSensitiveVars.forEach((key) => {
  if (!process.env[key]) {
    missingVars.push(key);
  }
});

if (missingVars.length > 0) {
  logger.fatal(`Missing required environment variables: ${missingVars.join(", ")}`);
  logger.fatal("Please check your .env file and ensure all required variables are set.");
  process.exit(1);
}

// Validate numeric environment variables
const validateNumeric = (key: string, value: string | undefined, defaultValue: string): number => {
  const parsed = parseInt(value || defaultValue);
  if (isNaN(parsed)) {
    logger.fatal(`Invalid numeric value for ${key}: ${value}`);
    process.exit(1);
  }
  return parsed;
};

// Validate URL format
const validateUrl = (url: string, varName: string): void => {
  try {
    new URL(url);
  } catch {
    logger.fatal(`Invalid URL format for ${varName}: ${url}`);
    process.exit(1);
  }
};

export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
export const PORT = process.env.PORT || "3000";
export const ACCESS_JWT_SECRET = process.env.ACCESS_JWT_SECRET!;
export const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET!;
export const DATABASE_URI = process.env.DATABASE_URI!;
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;
export const CALL_RING_TIMEOUT = validateNumeric("CALL_RING_TIMEOUT", process.env.CALL_RING_TIMEOUT, "45000");
export const CALL_MAX_DURATION = validateNumeric("CALL_MAX_DURATION", process.env.CALL_MAX_DURATION, "14400000");
export const CLEANUP_INTERVAL = validateNumeric("CLEANUP_INTERVAL", process.env.CLEANUP_INTERVAL, "300000");
export const STALE_THRESHOLD = validateNumeric("STALE_THRESHOLD", process.env.STALE_THRESHOLD, "1800000");
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "1h";
export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

// Validate URLs
if (CLIENT_URL) validateUrl(CLIENT_URL, "CLIENT_URL");
if (DATABASE_URI) validateUrl(DATABASE_URI, "DATABASE_URI");