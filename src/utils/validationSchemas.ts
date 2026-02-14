import Joi from "joi";
import { MESSAGE_TYPES } from "../config/constants.js";

export const registerSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[A-Za-z\s]+$/)
    .required()
    .messages({
      "string.min": "Name must be at least 3 characters long",
      "string.max": "Name cannot exceed 30 characters",
      "string.pattern.base": "Name must contain only letters",
    }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Invalid email format",
    }),
  username: Joi.string()
    .min(3)
    .max(20)
    .pattern(/^[a-z0-9._]+$/)
    .required()
    .messages({
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username cannot exceed 20 characters",
      "string.pattern.base": "Username can only contain lowercase letters, numbers, dots, and underscores",
    }),
  password: Joi.string()
    .min(8)
    .max(20)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.max": "Password cannot exceed 20 characters",
      "string.pattern.base": "Password must have at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
  status: Joi.string().max(100).optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Invalid email format",
    }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "any.required": "Refresh token is required",
  }),
});

export const createConversationSchema = Joi.object({
  participants: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required()
    .messages({
      "array.min": "At least one participant is required",
      "string.pattern.base": "Invalid participant ID format",
    }),
  name: Joi.string().max(100).optional(),
});

export const sendMessageSchema = Joi.object({
  conversationId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid conversation ID format",
    }),
  content: Joi.string().max(10000).optional(),
  messageType: Joi.string()
    .valid(...MESSAGE_TYPES)
    .optional(),
  replyTo: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  attachments: Joi.array().optional(),
});

export const updateUserStatusSchema = Joi.object({
  status: Joi.string().max(200).required().messages({
    "string.max": "Status cannot exceed 200 characters",
  }),
});

export const mongoIdParamSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid ID format",
    }),
});

export const callIdParamSchema = Joi.object({
  callId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid call ID format",
    }),
});
