import AppError from "./appError.js";

export const throwNotFound = (entity: string): never => {
  throw new AppError(`${entity} not found`, 404);
};

export const throwRequired = (field: string): never => {
  throw new AppError(`${field} is required`, 400);
};

export const throwTooLong = (field: string, limit: number): never => {
  throw new AppError(`${field} exceeds ${limit} characters`, 400);
};