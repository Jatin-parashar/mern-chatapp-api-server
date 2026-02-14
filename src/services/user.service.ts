import { Types } from "mongoose";
import User from "../models/user.model.js";
import { IUser } from "../types/models.js";
import { throwNotFound, throwRequired, throwTooLong } from "../utils/errorHelpers.js";
import { ENTITY_NAMES, VALIDATION_CONSTANTS } from "../config/constants.js";

export const findUserById = async (id: string | Types.ObjectId): Promise<IUser> => {
  const user = await User.findById(id);
  if (!user) throwNotFound(ENTITY_NAMES.USER);
  return user;
};

// These functions are now handled by queryBuilder utility in controllers

export const updateUserStatus = async (
  userId: string | Types.ObjectId,
  status: string
): Promise<IUser> => {
  if (!status) throwRequired(ENTITY_NAMES.STATUS_FIELD);
  if (status.length > VALIDATION_CONSTANTS.STATUS_MAX_LENGTH) throwTooLong(ENTITY_NAMES.STATUS_FIELD, VALIDATION_CONSTANTS.STATUS_MAX_LENGTH);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { status },
    { new: true, runValidators: true }
  );

  if (!updatedUser) throwNotFound(ENTITY_NAMES.USER);
  return updatedUser;
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  if (!username) throwRequired(ENTITY_NAMES.USERNAME);
  if (username.length > VALIDATION_CONSTANTS.USERNAME_MAX_LENGTH) throwTooLong(ENTITY_NAMES.USERNAME, VALIDATION_CONSTANTS.USERNAME_MAX_LENGTH);
  
  const existingUser = await User.findOne({ username });
  return !existingUser;
};