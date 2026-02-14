import { Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import {
  fetchUserConversationsById,
  handleConversationCreation,
} from "../services/conversation.service.js";
import { AuthRequest } from "../types/express.js";
import Conversation from "../models/conversation.model.js";
import { buildPaginatedQuery } from "../utils/queryBuilder.js";
import { conversationPopulateOptions } from "../utils/populateOptions.js";
import { setupConversationRooms } from "../services/socket.service.js";
import { BOOLEAN_STRINGS, MESSAGE_PREFIXES, SUCCESS_MESSAGES } from "../config/constants.js";

export const createConversation = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { participants, name } = req.body;
    const isGroup = req.query.isGroup === BOOLEAN_STRINGS.TRUE;

    const { conversation, created } = await handleConversationCreation({
      userId: req.user!._id,
      participants,
      name,
      isGroup,
    });

    if (created) {
      setupConversationRooms(conversation, req.user!._id.toString());
    }

    sendSuccessResponse(
      res,
      created ? 201 : 200,
      created
        ? `A new ${isGroup ? MESSAGE_PREFIXES.GROUP_CHAT : MESSAGE_PREFIXES.EMPTY}chat is successfully created`
        : SUCCESS_MESSAGES.CONVERSATION_EXISTS,
      { conversation }
    );
  }
);

export const getUserConversations = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const result = await buildPaginatedQuery(
      Conversation, 
      req.query, 
      { 
        filter: { 
          participants: req.user!._id,
          lastMessage: { $ne: null }
        },
        populate: conversationPopulateOptions,
        sort: { updatedAt: -1 },
        lean: true
      }
    );
    sendSuccessResponse(res, 200, SUCCESS_MESSAGES.CONVERSATIONS_FETCHED, result);
  }
);

export const getConversationById = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const conversation = await fetchUserConversationsById(
      req.params.id,
      req.user!._id
    );

    sendSuccessResponse(res, 200, SUCCESS_MESSAGES.CONVERSATION_FETCHED, {
      conversation,
    });
  }
);
