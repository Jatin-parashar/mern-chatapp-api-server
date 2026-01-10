import { Types } from "mongoose";
import Conversation from "../models/conversation.model.js";
import AppError from "../utils/appError.js";
import { throwNotFound } from "../utils/errorHelpers.js";
import { conversationPopulateOptions } from "../utils/populateOptions.js";
import { toString } from "../utils/common.js";
import logger from "../utils/logger.js";
import { IConversation } from "../types/models.js";
import { ConversationWithPopulatedFields } from "../types/service.js";

const validateParticipants = (
  participants: Array<string | Types.ObjectId>,
  userId: string | Types.ObjectId
): void => {
  if (!participants || participants.length < 1) {
    throw new AppError("At least one participant is required", 400);
  }
  
  const userIdStr = toString(userId);
  const participantsStr = participants.map(p => toString(p));
  
  if (!participantsStr.includes(userIdStr)) {
    throw new AppError("You must be part of the conversation participants", 400);
  }
};

const validateGroup = (
  participants: Array<string | Types.ObjectId>,
  name: string
): void => {
  if (!name || name.trim() === "") {
    throw new AppError("Group chats need a name", 400);
  }
  if (participants.length < 3) {
    throw new AppError("At least 3 participants are required for group chats (including you)", 400);
  }
};

const validateDirect = (participants: Array<string | Types.ObjectId>): void => {
  if (participants.length !== 2) {
    throw new AppError("One-on-one chat must have exactly 2 participants", 400);
  }
};

const findExistingDirectChat = async (
  participants: Array<string | Types.ObjectId>
): Promise<ConversationWithPopulatedFields | null> => {
  return await Conversation.findOne({
    isGroup: false,
    participants: { $all: participants, $size: 2 },
  })
    .populate(conversationPopulateOptions)
    .lean<ConversationWithPopulatedFields>();
};

const findOrCreateDirectChat = async (
  participants: Array<string | Types.ObjectId>
): Promise<{ conversation: ConversationWithPopulatedFields; created: boolean }> => {
  const sortedParticipants = participants.map(p => p.toString()).sort();
  
  const existing = await Conversation.findOne({
    isGroup: false,
    participants: { $all: sortedParticipants, $size: 2 },
  }).populate(conversationPopulateOptions).lean<ConversationWithPopulatedFields>();
  
  if (existing) {
    return { conversation: existing, created: false };
  }

  try {
    const conversation = await Conversation.create({
      isGroup: false,
      participants: sortedParticipants,
    });
    const populated = await conversation.populate(conversationPopulateOptions);
    return { conversation: populated.toObject() as ConversationWithPopulatedFields, created: true };
  } catch (error: any) {
    if (error.code === 11000) {
      const retry = await Conversation.findOne({
        isGroup: false,
        participants: { $all: sortedParticipants, $size: 2 },
      }).populate(conversationPopulateOptions).lean<ConversationWithPopulatedFields>();
      return { conversation: retry!, created: false };
    }
    throw error;
  }
};

export const validateUserBelongsToConversation = (
  conversation: IConversation | ConversationWithPopulatedFields,
  userId: string | Types.ObjectId
): void => {
  const userIdStr = toString(userId);
  const isParticipant = conversation.participants.some((p: any) =>
    toString(p._id || p) === userIdStr
  );
  
  if (!isParticipant) {
    throw new AppError("Unauthorized access to this conversation", 403);
  }
};

interface ConversationCreationParams {
  userId: string | Types.ObjectId;
  participants: Array<string | Types.ObjectId>;
  name?: string;
  isGroup: boolean;
}

export const handleConversationCreation = async ({
  userId,
  participants,
  name,
  isGroup,
}: ConversationCreationParams): Promise<{ 
  conversation: ConversationWithPopulatedFields; 
  created: boolean 
}> => {
  validateParticipants(participants, userId);

  if (isGroup) {
    validateGroup(participants, name!);
    const conversation = await Conversation.create({
      isGroup: true,
      participants,
      name: name!.trim(),
      admins: [userId],
    });
    const populated = await conversation.populate(conversationPopulateOptions);
    logger.debug(`New group conversation created: ${conversation._id}`);
    return { conversation: populated.toObject() as ConversationWithPopulatedFields, created: true };
  }

  validateDirect(participants);
  const result = await findOrCreateDirectChat(participants);
  logger.debug(`Direct chat ${result.created ? 'created' : 'found'}: ${result.conversation._id}`);
  return result;
};

// This function is now handled by queryBuilder utility in controllers

export const fetchUserConversationsById = async (
  conversationId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<ConversationWithPopulatedFields> => {
  const conversation = await Conversation.findById(conversationId)
    .populate(conversationPopulateOptions)
    .lean<ConversationWithPopulatedFields>();

  if (!conversation) throwNotFound("Conversation");
  
  validateUserBelongsToConversation(conversation!, userId);

  return conversation!;
};