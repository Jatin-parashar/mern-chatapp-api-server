import { Response } from "express";
import Message from "../models/message.model.js";
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
import { parsePaginationParams, createPaginationResult } from "../utils/pagination.js";
import { emitNewMessage, emitMessageSeen, emitConversationMessagesSeen } from "../services/socket.service.js";

export const sendMessage = catchAsync(async (req: AuthRequest, res: Response) => {
  const { conversationId, content, attachments, messageType, replyTo } = req.body;

  const messageData = {
    content,
    attachments,
    messageType: messageType || 'text',
    replyTo,
  };

  const message = await createMessageInConversation(
    req.user!._id,
    conversationId,
    messageData
  );

  emitNewMessage(req.user!._id.toString(), conversationId, message);

  sendSuccessResponse(res, 201, "Message sent successfully", { message });
});

export const getMessagesByConversation = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { limit, skip } = parsePaginationParams(
    req.query.limit as string,
    req.query.skip as string
  );

  const [messages, total] = await Promise.all([
    fetchMessagesByConversationId(id, limit, skip),
    Message.countDocuments({ conversationId: id })
  ]);

  const result = createPaginationResult(messages, total, limit, skip);
  sendSuccessResponse(res, 200, "Messages fetched successfully", result);
});

export const markConversationMessagesSeen = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const count = await markConversationMessagesSeenService(id, req.user!._id);

  if (count > 0) {
    emitConversationMessagesSeen(id, req.user!._id.toString());
  }

  sendSuccessResponse(res, 200, `${count} messages marked as seen.`, { count });
});

export const markMessageSeen = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { conversationId } = req.body;

  const alreadySeen = await markMessageAsSeen(id, req.user!._id);

  if (!alreadySeen && conversationId) {
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
