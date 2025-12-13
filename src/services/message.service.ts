import { Types } from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import AppError from "../utils/appError.js";
import { throwNotFound } from "../utils/errorHelpers.js";
import { messagePopulateOptions } from "../utils/populateOptions.js";
import { validateUserBelongsToConversation } from "./conversation.service.js";
import { toString } from "../utils/common.js";
import logger from "../utils/logger.js";
import { validateObjectId, validateStringLength } from "../utils/commonValidation.js";
import { MessageWithPopulatedFields } from "../types/service.js";
import { sanitizeHtml } from "../utils/sanitization.js";

interface MessageData {
  content?: string;
  attachments?: any[];
  messageType?: string;
  replyTo?: string | Types.ObjectId;
}

export const validateSendMessageInput = (
  conversationId: string | Types.ObjectId,
  messageData: MessageData
): void => {
  if (!conversationId) {
    throw new AppError("Conversation ID is required", 400);
  }

  const { content, attachments, messageType } = messageData;

  // Must have either non-empty content or attachments
  const hasContent = content && content.trim().length > 0;
  const hasAttachments = attachments && attachments.length > 0;

  if (!hasContent && !hasAttachments) {
    throw new AppError("Message must have either content or attachments", 400);
  }

  // Validate content length
  if (content) {
    validateStringLength(content, 10000, "Message content");
  }

  // Validate message type
  const validTypes = ["text", "image", "video", "audio", "document", "file"];
  if (messageType && !validTypes.includes(messageType)) {
    throw new AppError(
      `Invalid message type. Must be one of: ${validTypes.join(", ")}`,
      400
    );
  }
};



export const createMessageInConversation = async (
  userId: string | Types.ObjectId,
  conversationId: string | Types.ObjectId,
  messageData: MessageData
): Promise<MessageWithPopulatedFields> => {
  validateSendMessageInput(conversationId, messageData);

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  validateUserBelongsToConversation(conversation, userId.toString());

  const {
    content,
    attachments = [],
    messageType = "text",
    replyTo,
  } = messageData;

  // Build message object
  const messageObj: any = {
    conversationId,
    sender: userId,
    messageType,
  };

  // Add content if provided (sanitized)
  if (content) {
    messageObj.content = sanitizeHtml(content.trim());
  }

  // Add attachments if provided
  if (attachments && attachments.length > 0) {
    messageObj.attachments = attachments;
  }

  // Add reply reference if provided
  if (replyTo) {
    messageObj.replyTo = replyTo;
  }

  const message = await Message.create(messageObj);

  // Update conversation's last message
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    updatedAt: new Date(),
  });

  const populatedMessage = await message.populate(messagePopulateOptions);

  logger.debug(
    `${messageType} message created in conversation ${conversationId} by user ${userId}`
  );
  return populatedMessage.toObject() as MessageWithPopulatedFields;
};

export const fetchMessagesByConversationId = async (
  conversationId: string | Types.ObjectId,
  limit?: number,
  skip?: number
): Promise<MessageWithPopulatedFields[]> => {
  validateObjectId(conversationId, "Conversation ID");

  let query = Message.find({ conversationId })
    .populate(messagePopulateOptions)
    .sort({ createdAt: 1 });

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  if (skip !== undefined) {
    query = query.skip(skip);
  }

  const messages = await query.lean<MessageWithPopulatedFields[]>();
  return messages;
};

export const fetchMessagesByCursor = async (
  conversationId: string | Types.ObjectId,
  cursor?: string,
  limit: number = 50
): Promise<{ messages: MessageWithPopulatedFields[]; nextCursor: string | null }> => {
  validateObjectId(conversationId, "Conversation ID");

  const query: any = { conversationId };
  if (cursor) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }

  const messages = await Message.find(query)
    .populate(messagePopulateOptions)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean<MessageWithPopulatedFields[]>();

  const hasMore = messages.length > limit;
  const results = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? results[results.length - 1]._id.toString() : null;

  return { messages: results.reverse(), nextCursor };
};

export const markMessageAsSeen = async (
  messageId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<boolean> => {
  validateObjectId(messageId, "Message ID");

  const message = await Message.findById(messageId);
  if (!message) {
    throwNotFound("Message");
  }

  // Check if already seen
  const userIdStr = toString(userId);
  const alreadySeen = message.seenBy.some(
    (u: any) => toString(u) === userIdStr
  );

  if (alreadySeen) {
    return true;
  }

  await Message.findByIdAndUpdate(messageId, {
    $addToSet: { seenBy: userId },
  });

  logger.debug(`Message ${messageId} marked as seen by user ${userId}`);
  return false;
};

export const markConversationMessagesSeen = async (
  conversationId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<number> => {
  validateObjectId(conversationId, "Conversation ID");

  const messages = await Message.find({
    conversationId,
    sender: { $ne: userId },
    seenBy: { $ne: userId },
  });

  const messageIds = messages.map((msg) => msg._id);

  if (messageIds.length > 0) {
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { seenBy: userId } }
    );
    logger.debug(`${messageIds.length} messages marked as seen in conversation ${conversationId}`);
  }

  return messageIds.length;
};
