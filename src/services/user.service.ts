import { Types } from "mongoose";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import { IUser } from "../types/models.js";

export const findUserById = async (id: string | Types.ObjectId): Promise<IUser> => {
  const user = await User.findById(id);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const findAllUsers = async (
  limit?: number,
  skip?: number
): Promise<IUser[]> => {
  let query = User.find();

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  if (skip !== undefined) {
    query = query.skip(skip);
  }

  return await query;
};

export const searchUsers = async (
  keyword: string = "",
  limit?: number,
  skip?: number
): Promise<IUser[]> => {
  let query = User.find({
    $or: [
      { name: { $regex: keyword, $options: "i" } },
      { username: { $regex: keyword, $options: "i" } },
    ],
  });

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  if (skip !== undefined) {
    query = query.skip(skip);
  }

  return await query;
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