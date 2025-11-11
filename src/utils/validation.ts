import Joi from "joi";
import AppError from "./appError.js";

const nameSchema = Joi.string()
  .min(3)
  .max(30)
  .pattern(/^[A-Za-z\s]+$/)
  .required()
  .messages({
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name cannot exceed 30 characters",
    "string.pattern.base": "Name must contain only letters",
    "any.required": "Name is required",
  });

const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .required()
  .messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  });

const passwordSchema = Joi.string()
  .min(8)
  .max(20)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
  .required()
  .messages({
    "string.min": "Password must be at least 8 characters",
    "string.max": "Password cannot exceed 20 characters",
    "string.pattern.base":
      "Password must have at least one uppercase letter, one lowercase letter, one number, and one special character",
    "any.required": "Password is required",
  });

const usernameSchema = Joi.string()
  .min(3)
  .max(20)
  .pattern(/^[a-z0-9._]+$/)
  .required()
  .messages({
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username cannot exceed 20 characters",
    "string.pattern.base": "Username can only contain lowercase letters, numbers, dots, and underscores",
    "any.required": "Username is required",
  });

type Validator = (value: string) => Joi.ValidationResult;

export const validateName = (name: string): Joi.ValidationResult => {
  return nameSchema.validate(name);
};

export const validateEmail = (email: string): Joi.ValidationResult => {
  return emailSchema.validate(email);
};

export const validatePassword = (password: string): Joi.ValidationResult => {
  return passwordSchema.validate(password);
};

export const validateUsername = (username: string): Joi.ValidationResult => {
  return usernameSchema.validate(username);
};

export const validateField = (value: string, validator: Validator): void => {
  const validation = validator(value);
  if (validation.error) {
    throw new AppError(
      validation.error.details[0].message,
      400
    );
  }
};