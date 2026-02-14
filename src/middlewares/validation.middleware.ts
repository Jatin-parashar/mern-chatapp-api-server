import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import AppError from "../utils/appError.js";
import { VALIDATION_SOURCES } from "../config/constants.js";

type ValidationSource = typeof VALIDATION_SOURCES[keyof typeof VALIDATION_SOURCES];

export const validate = (schema: Joi.ObjectSchema, source: ValidationSource = VALIDATION_SOURCES.BODY) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req[source], { abortEarly: false });
    
    if (error) {
      const message = error.details.map(detail => detail.message).join(", ");
      throw new AppError(message, 400);
    }
    
    next();
  };
};
