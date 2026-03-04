import { Types } from "mongoose";
import AppError from "./appError.js";

export const validateObjectId = (id: string | Types.ObjectId, fieldName: string = "ID"): void => {
  if (!id) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`${fieldName} is invalid`, 400);
  }
};

export const validateArrayNotEmpty = <T>(array: T[], fieldName: string): void => {
  if (!array || array.length === 0) {
    throw new AppError(`${fieldName} cannot be empty`, 400);
  }
};

export const validateStringLength = (str: string, maxLength: number, fieldName: string): void => {
  if (str && str.length > maxLength) {
    throw new AppError(`${fieldName} exceeds ${maxLength} characters`, 400);
  }
};