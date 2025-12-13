import { Types } from "mongoose";
import User from "../models/user.model.js";
import { IUser } from "../types/models.js";
import { throwNotFound, throwRequired, throwTooLong } from "../utils/errorHelpers.js";

export const findUserById = async (id: string | Types.ObjectId): Promise<IUser> => {
  const user = await User.findById(id);
  if (!user) throwNotFound("User");
  return user;
};

// These functions are now handled by queryBuilder utility in controllers

export const updateUserStatus = async (
  userId: string | Types.ObjectId,
  status: string
): Promise<IUser> => {
  if (!status) throwRequired("Status field");
  if (status.length > 200) throwTooLong("Status", 200);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { status },
    { new: true, runValidators: true }
  );

  if (!updatedUser) throwNotFound("User");
  return updatedUser;
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  if (!username) throwRequired("Username");
  if (username.length > 50) throwTooLong("Username", 50);
  
  const existingUser = await User.findOne({ username });
  return !existingUser;
};