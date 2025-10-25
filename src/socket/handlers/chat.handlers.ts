import { Server, Socket } from "socket.io";
import {
  SOCKET_JOIN_ROOM,
  SOCKET_NEW_MESSAGE,
  SOCKET_MESSAGE_RECEIVED,
  SOCKET_NEW_CONVERSATION,
  SOCKET_NEW_CONVERSATION_RECEIVED,
  SOCKET_MESSAGE_SEEN,
  SOCKET_MESSAGE_SEEN_UPDATE,
  SOCKET_CONVERSATION_MESSAGES_SEEN,
  SOCKET_CONVERSATION_MESSAGES_SEEN_UPDATE,
} from "../../constants/socketConstants.js";
import { conversationPopulateOptions } from "../../utils/populateOptions.js";
import logger from "../../utils/logger.js";
import { onlineUsers } from "../utils/socketHelpers.js";
import { Types } from "mongoose";
import Conversation from "../../models/conversation.model.js";

interface MessageEventData {
  message: {
    conversationId: string;
    [key: string]: any;
  };
  userId?: string;
}

interface NewConversationEventData {
  conversationId: string;
  userId: string;
}

interface MessageSeenEventData {
  conversationId: string;
  messageId: string;
  userId: string;
}

interface ConversationMessagesSeenEventData {
  conversationId: string;
  userId: string;
}

/**
 * Handle chat-related socket events (messages, conversations, seen status)
 */
export const registerChatHandlers = (io: Server, socket: Socket): void => {
  
  // Handle joining a conversation room
  socket.on(SOCKET_JOIN_ROOM, (roomId: string): void => {
    if (!roomId) {
      logger.warn("Join room event missing roomId");
      return;
    }
    
    if (!socket.rooms.has(roomId)) {
      socket.join(roomId);
      logger.debug(`Socket ${socket.id} joined room ${roomId}`);
    }
  });

  // Handle new message sent
  socket.on(SOCKET_NEW_MESSAGE, ({ message, userId }: MessageEventData): void => {
    if (!message) {
      logger.warn("New message event missing message data");
      return;
    }
    
    const { conversationId } = message;
    
    // Emit to user's other devices
    if (userId) {
      io.to(userId).emit(SOCKET_MESSAGE_RECEIVED, message);
    }
    
    // Emit to conversation room (for other participants)
    if (conversationId) {
      socket.to(conversationId).emit(SOCKET_MESSAGE_RECEIVED, message);
      logger.debug(`Message broadcasted to conversation ${conversationId}`);
    }
  });

  // Handle new conversation created
  socket.on(SOCKET_NEW_CONVERSATION, async ({ conversationId, userId }: NewConversationEventData): Promise<void> => {
    if (!conversationId || !userId) {
      logger.warn("New conversation event missing conversationId or userId");
      return;
    }
    
    try {
      const conversation = await Conversation.findById(conversationId).populate(
        conversationPopulateOptions
      );

      if (!conversation) {
        logger.error(`Conversation ${conversationId} not found`);
        return;
      }

      // Add all participants to the conversation room
      conversation.participants.forEach((participant: any) => {
        const participantId = (participant._id as Types.ObjectId).toString();
        const socketIds = onlineUsers.get(participantId);

        if (socketIds && socketIds.length > 0) {
          socketIds.forEach((id) => {
            const participantSocket = io.sockets.sockets.get(id);
            if (participantSocket) {
              // Join the conversation room
              participantSocket.join(conversationId);

              // Notify participant if they're not the creator
              if (participantId !== userId) {
                participantSocket.emit(SOCKET_NEW_CONVERSATION_RECEIVED, {
                  conversation,
                });
                logger.debug(`New conversation sent to participant ${participantId}`);
              }
            }
          });
        }
      });
      
      logger.debug(`Conversation ${conversationId} setup completed for ${conversation.participants.length} participants`);
    } catch (error) {
      logger.error({ err: error }, "Error handling new conversation");
    }
  });

  // Handle message seen by a user
  socket.on(SOCKET_MESSAGE_SEEN, ({ conversationId, messageId, userId }: MessageSeenEventData): void => {
    if (!conversationId || !messageId || !userId) {
      logger.warn("Message seen event missing required data");
      return;
    }
    
    socket.to(conversationId).emit(SOCKET_MESSAGE_SEEN_UPDATE, {
      conversationId,
      messageId,
      userId,
    });
    logger.debug(`Message ${messageId} marked as seen by user ${userId}`);
  });

  // Handle all messages in conversation marked as seen
  socket.on(SOCKET_CONVERSATION_MESSAGES_SEEN, ({ conversationId, userId }: ConversationMessagesSeenEventData): void => {
    if (!conversationId || !userId) {
      logger.warn("Conversation messages seen event missing required data");
      return;
    }
    
    socket.to(conversationId).emit(SOCKET_CONVERSATION_MESSAGES_SEEN_UPDATE, {
      conversationId,
      userId,
    });
    logger.debug(`All messages in conversation ${conversationId} marked as seen by user ${userId}`);
  });
};