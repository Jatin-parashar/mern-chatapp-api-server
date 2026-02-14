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
import { HTTP_MESSAGES, MESSAGE_TYPES, VALIDATION_LIMITS, MESSAGE_DEFAULTS, ENTITY_NAMES } from "../config/constants.js";

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
    throw new AppError(HTTP_MESSAGES.VALIDATION.INVALID_CONVERSATION_ID, 400);
  }

  const { content, attachments, messageType } = messageData;

  const hasContent = content && content.trim().length > 0;
  const hasAttachments = attachments && attachments.length > 0;

  if (!hasContent && !hasAttachments) {
    throw new AppError(HTTP_MESSAGES.VALIDATION.CONTENT_OR_ATTACHMENTS_REQUIRED, 400);
  }

  if (content) {
    validateStringLength(content, VALIDATION_LIMITS.MESSAGE_CONTENT_MAX, "Message content");
  }

  if (messageType && !MESSAGE_TYPES.includes(messageType as any)) {
    throw new AppError(
      `${HTTP_MESSAGES.VALIDATION.INVALID_MESSAGE_TYPE}. Must be one of: ${MESSAGE_TYPES.join(", ")}`,
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
    throw new AppError(HTTP_MESSAGES.ERROR.NOT_FOUND.replace("not found", "Conversation not found"), 404);
  }

  validateUserBelongsToConversation(conversation, userId.toString());

  const {
    content,
    attachments = [],
    messageType = MESSAGE_DEFAULTS.TYPE,
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

  // Create message and update conversation in parallel
  const [message] = await Promise.all([
    Message.create(messageObj),
    Conversation.findByIdAndUpdate(conversationId, {
      updatedAt: new Date(),
    }),
  ]);

  // Update lastMessage after creation
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
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
): Promise<{ conversationId: string; alreadySeen: boolean }> => {
  validateObjectId(messageId, "Message ID");

  // First, check permissions before attempting update
  const message = await Message.findById(messageId, { conversationId: 1, sender: 1, seenBy: 1 });
  if (!message) {
    throwNotFound(ENTITY_NAMES.MESSAGE);
  }
  
  // Check if user is trying to mark their own message
  if (toString(message.sender) === toString(userId)) {
    throw new AppError(HTTP_MESSAGES.ERROR.CANNOT_MARK_OWN_MESSAGE, 400);
  }
  
  // Check if already seen
  const alreadySeen = message.seenBy.some((id: any) => toString(id) === toString(userId));
  if (alreadySeen) {
    return { conversationId: message.conversationId.toString(), alreadySeen: true };
  }
  
  // Validate user belongs to conversation
  const conversation = await Conversation.findById(message.conversationId, { participants: 1 });
  if (!conversation) {
    throw new AppError("Conversation " + HTTP_MESSAGES.ERROR.NOT_FOUND, 404);
  }
  
  const isParticipant = conversation.participants.some(
    (p: any) => toString(p) === toString(userId)
  );
  
  if (!isParticipant) {
    throw new AppError(HTTP_MESSAGES.ERROR.NOT_PARTICIPANT, 403);
  }

  // Now safely update
  await Message.findByIdAndUpdate(messageId, { $addToSet: { seenBy: userId } });

  logger.debug(`Message ${messageId} marked as seen by user ${userId}`);
  return { conversationId: message.conversationId.toString(), alreadySeen: false };
};

export const markConversationMessagesSeen = async (
  conversationId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<number> => {
  validateObjectId(conversationId, "Conversation ID");

  const result = await Message.updateMany(
    {
      conversationId,
      sender: { $ne: userId },
      seenBy: { $ne: userId },
    },
    { $addToSet: { seenBy: userId } }
  );

  if (result.modifiedCount > 0) {
    logger.debug(`${result.modifiedCount} messages marked as seen in conversation ${conversationId}`);
  }

  return result.modifiedCount;
};

export const markPendingMessagesAsDelivered = async (
  userId: string | Types.ObjectId
): Promise<Array<{ messageId: string; conversationId: string }>> => {
  validateObjectId(userId, "User ID");

  const messages = await Message.find(
    {
      sender: { $ne: userId },
      deliveredTo: { $ne: userId },
    },
    { _id: 1, conversationId: 1 }
  ).lean();

  if (messages.length === 0) {
    return [];
  }

  const messageIds = messages.map(m => m._id);
  await Message.updateMany(
    { _id: { $in: messageIds } },
    { $addToSet: { deliveredTo: userId } }
  );

  logger.debug(`${messages.length} pending messages marked as delivered to user ${userId}`);
  
  // Return both messageIds and conversationIds for notifications
  return messages.map(m => ({
    messageId: (m._id as Types.ObjectId).toString(),
    conversationId: (m.conversationId as Types.ObjectId).toString(),
  }));
};
