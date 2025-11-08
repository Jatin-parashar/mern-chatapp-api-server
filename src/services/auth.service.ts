import User from "../models/user.model.js";
import AuthCredential from "../models/auth.model.js";
import AppError from "../utils/appError.js";
import { hashPassword, verifyPassword } from "../utils/auth.js";
import {
  validateEmail,
  validateField,
  validateName,
  validatePassword,
} from "../utils/validation.js";
import { UserPayload } from "../types/user.js";

export const createUser = async (
  name: string,
  email: string,
  username: string,
  password: string,
  status?: string,
  profilePic?: string
): Promise<UserPayload> => {
  if (!name || !email || !password) {
    throw new AppError("All fields are required", 400);
  }

  validateField(name, validateName);
  validateField(email, validateEmail);
  validateField(password, validatePassword);

  const existingUser = await AuthCredential.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

  const hashedPassword = await hashPassword(password);

  const user = await AuthCredential.create({
    email,
    password: hashedPassword,
  });

  await User.create({
    _id: user._id,
    name,
    username,
    ...(status !== undefined && { status }),
    ...(profilePic !== undefined && { profilePic }),
  });

  const createdUser: UserPayload = {
    _id: user._id.toString(),
    email: user.email,
  };

  return createdUser;
};

export const loginUser = async (
  email: string,
  password: string
): Promise<UserPayload> => {
  if (!email || !password) {
    throw new AppError("All fields are required", 400);
  }

  validateField(email, validateEmail);

  const existingUser = await AuthCredential.findOne({ email });
  if (!existingUser) {
    throw new AppError("User does not exist", 400);
  }

  const IsEnteredPasswordCorrect = await verifyPassword(
    password,
    existingUser.password
  );

  if (!IsEnteredPasswordCorrect)
    throw new AppError("Entered Password is incorrect", 400);

  const authenticatedUser: UserPayload = {
    email: existingUser.email,
    _id: existingUser._id.toString(),
  };
  
  return authenticatedUser;
};