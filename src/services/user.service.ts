import { Types } from "mongoose";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import { IUser } from "../types/models.js";

export const findUserById = async (id: string | Types.ObjectId): Promise<IUser> => {
  const user = await User.findById(id);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const findAllUsers = async (): Promise<IUser[]> => {
  return await User.find();
};

export const searchUsers = async (keyword: string = ""): Promise<IUser[]> => {
  return await User.find({
    name: { $regex: keyword, $options: "i" },
  });
};

export const updateUserStatus = async (
  userId: string | Types.ObjectId,
  status: string
): Promise<IUser> => {
  if (!status) throw new AppError("Status field is required", 400);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { status },
    { new: true, runValidators: true }
  );

  if (!updatedUser) throw new AppError("User not found", 404);
  return updatedUser;
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  if (!username) throw new AppError("Username is required", 400);
  
  const existingUser = await User.findOne({ username });
  return !existingUser;
};