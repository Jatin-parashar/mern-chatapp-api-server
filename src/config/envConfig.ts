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
export const SOCKET_URL = process.env.SOCKET_URL || "http://localhost:3000";
export const PORT = process.env.PORT || "3000";
export const ACCESS_JWT_SECRET = process.env.ACCESS_JWT_SECRET!;
export const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET!;
export const DATABASE_URI = process.env.DATABASE_URI!;
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;