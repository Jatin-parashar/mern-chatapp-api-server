import { Response } from "express";
import Message from "../models/message.model.js";
import {
  createMessageInConversation,
  fetchMessagesByConversationId,
  markMessageAsSeen,
} from "../services/message.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import { AuthRequest } from "../types/express.js";

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

  sendSuccessResponse(res, 201, "Message sent successfully", { message });
});

export const getMessagesByConversation = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit as string) || 100;
  const skip = parseInt(req.query.skip as string) || 0;

  const messages = await fetchMessagesByConversationId(id);
  
  // Apply pagination
  const paginatedMessages = messages.slice(skip, skip + limit);

  sendSuccessResponse(res, 200, "Messages fetched successfully", {
    messages: paginatedMessages,
    count: paginatedMessages.length,
    total: messages.length,
  });
});

export const markConversationMessagesSeen = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const messages = await Message.find({
    conversationId: id,
    sender: { $ne: req.user!._id },
    seenBy: { $ne: req.user!._id },
  });

  const messageIds = messages.map((msg) => msg._id);

  await Message.updateMany(
    { _id: { $in: messageIds } },
    { $addToSet: { seenBy: req.user!._id } }
  );

  sendSuccessResponse(res, 200, `${messageIds.length} messages marked as seen.`, {
    count: messageIds.length,
  });
});

export const markMessageSeen = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const alreadySeen = await markMessageAsSeen(id, req.user!._id);

  sendSuccessResponse(
    res,
    200,
    alreadySeen
      ? "Message already marked as seen"
      : "Message marked as seen successfully"
  );
});
