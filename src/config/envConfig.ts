import dotenv from "dotenv";
dotenv.config();

const requiredSensitiveVars = [
  "ACCESS_JWT_SECRET",
  "REFRESH_JWT_SECRET",
  "DATABASE_URI",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

requiredSensitiveVars.forEach((key) => {
  if (!process.env[key]) {
      console.error(`Critical environment variable ${key} is missing. Shutting down.`);
      process.exit(1);
    }
});

export const NODE_ENV = process.env.NODE_ENV || "development";
export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
export const PORT = process.env.PORT || "3000";
export const ACCESS_JWT_SECRET = process.env.ACCESS_JWT_SECRET!;
export const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET!;
export const DATABASE_URI = process.env.DATABASE_URI!;
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;
export const CALL_RING_TIMEOUT = parseInt(process.env.CALL_RING_TIMEOUT || "45000");
export const CALL_MAX_DURATION = parseInt(process.env.CALL_MAX_DURATION || "14400000"); // 4 hours
export const CLEANUP_INTERVAL = parseInt(process.env.CLEANUP_INTERVAL || "300000"); // 5 minutes
export const STALE_THRESHOLD = parseInt(process.env.STALE_THRESHOLD || "1800000"); // 30 minutes
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "1h";
export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";