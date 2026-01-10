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

  const result = await Message.findOneAndUpdate(
    {
      _id: messageId,
      sender: { $ne: userId }, // Can't mark own message as seen
      seenBy: { $ne: userId },
    },
    { $addToSet: { seenBy: userId } },
    { new: false, projection: { conversationId: 1 } }
  );

  if (!result) {
    const message = await Message.findById(messageId, { conversationId: 1, sender: 1, seenBy: 1 });
    if (!message) {
      throwNotFound("Message");
    }
    
    // Check if user is trying to mark their own message
    if (toString(message.sender) === toString(userId)) {
      throw new AppError("Cannot mark your own message as seen", 400);
    }
    
    return { conversationId: message.conversationId.toString(), alreadySeen: true };
  }

  // Validate user belongs to conversation
  const conversation = await Conversation.findById(result.conversationId, { participants: 1 });
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }
  
  const isParticipant = conversation.participants.some(
    (p: any) => toString(p) === toString(userId)
  );
  
  if (!isParticipant) {
    // Rollback the update
    await Message.findByIdAndUpdate(messageId, { $pull: { seenBy: userId } });
    throw new AppError("You are not a participant in this conversation", 403);
  }

  logger.debug(`Message ${messageId} marked as seen by user ${userId}`);
  return { conversationId: result.conversationId.toString(), alreadySeen: false };
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

export const markMessageAsDelivered = async (
  messageId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<{ conversationId: string; alreadyDelivered: boolean }> => {
  validateObjectId(messageId, "Message ID");

  const result = await Message.findOneAndUpdate(
    {
      _id: messageId,
      sender: { $ne: userId }, // Can't mark own message as delivered
      deliveredTo: { $ne: userId },
    },
    { $addToSet: { deliveredTo: userId } },
    { new: false, projection: { conversationId: 1 } }
  );

  if (!result) {
    const message = await Message.findById(messageId, { conversationId: 1, sender: 1, deliveredTo: 1 });
    if (!message) {
      throwNotFound("Message");
    }
    
    // Check if user is trying to mark their own message
    if (toString(message.sender) === toString(userId)) {
      throw new AppError("Cannot mark your own message as delivered", 400);
    }
    
    return { conversationId: message.conversationId.toString(), alreadyDelivered: true };
  }

  // Validate user belongs to conversation
  const conversation = await Conversation.findById(result.conversationId, { participants: 1 });
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }
  
  const isParticipant = conversation.participants.some(
    (p: any) => toString(p) === toString(userId)
  );
  
  if (!isParticipant) {
    // Rollback the update
    await Message.findByIdAndUpdate(messageId, { $pull: { deliveredTo: userId } });
    throw new AppError("You are not a participant in this conversation", 403);
  }

  logger.debug(`Message ${messageId} marked as delivered to user ${userId}`);
  return { conversationId: result.conversationId.toString(), alreadyDelivered: false };
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
