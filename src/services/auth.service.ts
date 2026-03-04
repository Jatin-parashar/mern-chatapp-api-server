import mongoose from "mongoose";
import User from "../models/user.model.js";
import AuthCredential from "../models/auth.model.js";
import { throwRequired } from "../utils/errorHelpers.js";
import AppError from "../utils/appError.js";
import { hashPassword, verifyPassword } from "../utils/auth.js";
import { UserPayload } from "../types/user.js";
import { HTTP_MESSAGES, FAKE_HASH } from "../config/constants.js";

export const createUser = async (
  name: string,
  email: string,
  username: string,
  password: string,
  status?: string,
  profilePic?: string
): Promise<UserPayload> => {
  const existingUser = await AuthCredential.findOne({ email });
  if (existingUser) {
    throw new AppError(HTTP_MESSAGES.AUTH.EMAIL_IN_USE, 400);
  }

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    throw new AppError(HTTP_MESSAGES.AUTH.USERNAME_TAKEN, 400);
  }

  const hashedPassword = await hashPassword(password);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [auth] = await AuthCredential.create([{ email, password: hashedPassword }], { session });

    await User.create([{
      _id: auth._id,
      name,
      username,
      ...(status !== undefined && { status }),
      ...(profilePic !== undefined && { profilePic }),
    }], { session });

    await session.commitTransaction();

    return { _id: auth._id.toString(), email: auth.email };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const loginUser = async (
  email: string,
  password: string
): Promise<UserPayload> => {
  if (!email || !password) {
    throwRequired(HTTP_MESSAGES.AUTH.ALL_FIELDS_REQUIRED);
  }

  const existingUser = await AuthCredential.findOne({ email });
  
  // Always verify password even if user doesn't exist (timing attack prevention)
  const isPasswordCorrect = existingUser 
    ? await verifyPassword(password, existingUser.password)
    : await verifyPassword(password, FAKE_HASH);

  if (!existingUser || !isPasswordCorrect) {
    throw new AppError(HTTP_MESSAGES.AUTH.INVALID_CREDENTIALS, 401);
  }

  const authenticatedUser: UserPayload = {
    email: existingUser.email,
    _id: existingUser._id.toString(),
  };
  
  return authenticatedUser;
};