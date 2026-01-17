import { Response } from "express";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import {
  createMessageInConversation,
  fetchMessagesByConversationId,
  fetchMessagesByCursor,
  markMessageAsSeen,
  markConversationMessagesSeen as markConversationMessagesSeenService,
} from "../services/message.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import { AuthRequest } from "../types/express.js";
import { buildPaginatedQuery } from "../utils/queryBuilder.js";
import { messagePopulateOptions, conversationPopulateOptions } from "../utils/populateOptions.js";
import { emitNewMessage, emitMessageSeen, emitConversationMessagesSeen, notifyNewConversation } from "../services/socket.service.js";

export const sendMessage = catchAsync(async (req: AuthRequest, res: Response) => {
  const { conversationId, content, attachments, messageType, replyTo } = req.body;

  const messageData = {
    content,
    attachments,
    messageType: messageType || 'text',
    replyTo,
  };

  const conversation = await Conversation.findById(conversationId, { lastMessage: 1 });
  const isFirstMessage = !conversation?.lastMessage;

  const message = await createMessageInConversation(
    req.user!._id,
    conversationId,
    messageData
  );

  await emitNewMessage(req.user!._id.toString(), conversationId, message);

  const responseData: any = { message };

  if (isFirstMessage) {
    const fullConversation = await Conversation.findById(conversationId).populate(conversationPopulateOptions).lean();
    notifyNewConversation(fullConversation!, req.user!._id.toString());
    responseData.conversation = fullConversation;
  }

  sendSuccessResponse(res, 201, "Message sent successfully", responseData);
});

export const getMessagesByConversation = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await buildPaginatedQuery(
    Message,
    req.query,
    {
      filter: { conversationId: id },
      populate: messagePopulateOptions,
      sort: { createdAt: 1 },
      lean: true
    }
  );
  sendSuccessResponse(res, 200, "Messages fetched successfully", result);
});

export const markConversationMessagesSeen = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const count = await markConversationMessagesSeenService(id, req.user!._id);

  if (count > 0) {
    emitConversationMessagesSeen(id, req.user!._id.toString());
  }

  sendSuccessResponse(res, 200, `${count} message${count !== 1 ? 's' : ''} marked as seen`, { count });
});

export const markMessageSeen = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { conversationId, alreadySeen } = await markMessageAsSeen(id, req.user!._id);

  if (!alreadySeen) {
    emitMessageSeen(conversationId, id, req.user!._id.toString());
  }

  sendSuccessResponse(
    res,
    200,
    alreadySeen
      ? "Message already marked as seen"
      : "Message marked as seen successfully"
  );
});

export const getMessagesByCursor = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const cursor = req.query.cursor as string | undefined;
  const limit = parseInt(req.query.limit as string) || 50;

  const result = await fetchMessagesByCursor(id, cursor, limit);
  sendSuccessResponse(res, 200, "Messages fetched successfully", result);
});
