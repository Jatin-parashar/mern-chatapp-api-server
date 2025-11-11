import { Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import {
  fetchUserConversations,
  fetchUserConversationsById,
  handleConversationCreation,
} from "../services/conversation.service.js";
import { AuthRequest } from "../types/express.js";
import Conversation from "../models/conversation.model.js";
import { parsePaginationParams, createPaginationResult } from "../utils/pagination.js";

export const createConversation = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { participants, name } = req.body;
    const isGroup = req.query.isGroup === "true";

    const { conversation, created } = await handleConversationCreation({
      userId: req.user!._id,
      participants,
      name,
      isGroup,
    });

    sendSuccessResponse(
      res,
      created ? 201 : 200,
      created
        ? `A new ${isGroup ? "group " : ""}chat is successfully created`
        : "Conversation already exists",
      { conversation }
    );
  }
);

export const getUserConversations = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { limit, skip } = parsePaginationParams(
      req.query.limit as string,
      req.query.skip as string
    );

    const [conversations, total] = await Promise.all([
      fetchUserConversations(req.user!._id, limit, skip),
      Conversation.countDocuments({ participants: req.user!._id })
    ]);

    const result = createPaginationResult(conversations, total, limit, skip);
    sendSuccessResponse(res, 200, "User conversations fetched successfully", result);
  }
);

export const getConversationById = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const conversation = await fetchUserConversationsById(
      req.params.id,
      req.user!._id
    );

    sendSuccessResponse(res, 200, "Conversation fetched successfully", {
      conversation,
    });
  }
);
