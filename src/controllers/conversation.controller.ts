import { Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import {
  fetchUserConversations,
  fetchUserConversationsById,
  handleConversationCreation,
} from "../services/conversation.service.js";
import { AuthRequest } from "../types/express.js";

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

    res.status(created ? 201 : 200).json({
      status: "success",
      message: created
        ? `A new ${isGroup ? "group " : ""}chat is successfully created`
        : "Conversation already exists",
      conversation,
    });
  }
);

export const getUserConversations = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const conversations = await fetchUserConversations(req.user!._id);

    res.status(200).json({
      status: "success",
      message: "User conversations fetched successfully",
      conversations,
    });
  }
);

export const getConversationById = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const conversation = await fetchUserConversationsById(
      req.params.id,
      req.user!._id
    );

    res.status(200).json({
      status: "success",
      message: "Conversation fetched successfully",
      conversation,
    });
  }
);
