import { Types } from "mongoose";
import Conversation from "../models/conversation.model.js";
import AppError from "../utils/appError.js";
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
  // Validate inputs
  validateParticipants(participants, userId);

  if (isGroup) {
    validateGroup(participants, name!);
  } else {
    validateDirect(participants);
    
    // Check if direct chat already exists
    const existing = await findExistingDirectChat(participants);
    if (existing) {
      logger.debug(`Existing direct chat found: ${existing._id}`);
      return { conversation: existing, created: false };
    }
  }

  // Create new conversation
  const conversationData: any = {
    isGroup,
    participants,
  };
  
  if (isGroup) {
    conversationData.name = name!.trim();
    conversationData.admins = [userId];
  }

  const conversation = await Conversation.create(conversationData);
  const populatedConversation = await conversation
    .populate(conversationPopulateOptions);

  logger.debug(`New ${isGroup ? 'group' : 'direct'} conversation created: ${conversation._id}`);
  return { 
    conversation: populatedConversation.toObject() as ConversationWithPopulatedFields, 
    created: true 
  };
};

export const fetchUserConversations = async (
  userId: string | Types.ObjectId
): Promise<ConversationWithPopulatedFields[]> => {
  return await Conversation.find({ participants: userId })
    .populate(conversationPopulateOptions)
    .sort({ updatedAt: -1 })
    .lean<ConversationWithPopulatedFields[]>();
};

export const fetchUserConversationsById = async (
  conversationId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<ConversationWithPopulatedFields> => {
  const conversation = await Conversation.findById(conversationId)
    .populate(conversationPopulateOptions)
    .lean<ConversationWithPopulatedFields>();

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  validateUserBelongsToConversation(conversation, userId);

  return conversation;
};