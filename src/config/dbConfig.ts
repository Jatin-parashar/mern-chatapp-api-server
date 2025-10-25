import { connect } from "mongoose";
import logger from "../utils/logger.js";
import { DATABASE_URI } from "./envConfig.js";

export async function connectDB() {
  try {
    await connect(DATABASE_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info("Connected to MongoDB with connection pooling");
  } catch (err) {
    logger.error(err, "Connection to MongoDB database failed!");
    process.exit(1);
  }
}
