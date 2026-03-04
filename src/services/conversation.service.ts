import { Types } from "mongoose";
import Conversation from "../models/conversation.model.js";
import AppError from "../utils/appError.js";
import { throwNotFound } from "../utils/errorHelpers.js";
import { conversationPopulateOptions } from "../utils/populateOptions.js";
import { toString } from "../utils/common.js";
import logger from "../utils/logger.js";
import { IConversation } from "../types/models.js";
import { ConversationWithPopulatedFields } from "../types/service.js";
import { HTTP_MESSAGES, CONVERSATION_ERRORS, ENTITY_NAMES, VALIDATION_CONSTANTS } from "../config/constants.js";

const validateParticipants = (
  participants: Array<string | Types.ObjectId>,
  userId: string | Types.ObjectId
): void => {
  if (!participants || participants.length < 1) {
    throw new AppError(HTTP_MESSAGES.VALIDATION.PARTICIPANT_REQUIRED, 400);
  }
  
  const userIdStr = toString(userId);
  const participantsStr = participants.map(p => toString(p));
  
  if (!participantsStr.includes(userIdStr)) {
    throw new AppError(CONVERSATION_ERRORS.MUST_BE_PARTICIPANT, 400);
  }
};

const validateGroup = (
  participants: Array<string | Types.ObjectId>,
  name: string
): void => {
  if (!name || name.trim() === VALIDATION_CONSTANTS.EMPTY_STRING) {
    throw new AppError(HTTP_MESSAGES.VALIDATION.GROUP_NAME_REQUIRED, 400);
  }
  if (participants.length < 2) {
    throw new AppError(HTTP_MESSAGES.VALIDATION.MIN_PARTICIPANTS_GROUP, 400);
  }
};

const validateDirect = (participants: Array<string | Types.ObjectId>): void => {
  if (participants.length !== 2) {
    throw new AppError(HTTP_MESSAGES.VALIDATION.EXACT_TWO_PARTICIPANTS, 400);
  }
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
    throw new AppError(CONVERSATION_ERRORS.UNAUTHORIZED_ACCESS, 403);
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

  if (!conversation) throwNotFound(ENTITY_NAMES.CONVERSATION);
  
  validateUserBelongsToConversation(conversation!, userId);

  return conversation!;
};