import { Server } from "socket.io";
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
import { CustomSocket } from "../utils/socketAuth.js";

interface MessageEventData {
  message: {
    conversationId: string;
    [key: string]: any;
  };
}

interface NewConversationEventData {
  conversationId: string;
}

interface MessageSeenEventData {
  conversationId: string;
  messageId: string;
}

interface ConversationMessagesSeenEventData {
  conversationId: string;
}

/**
 * Handle chat-related socket events (messages, conversations, seen status)
 */
export const registerChatHandlers = (io: Server, socket: CustomSocket): void => {
  
  // Handle joining a conversation room
  socket.on(SOCKET_JOIN_ROOM, (roomId: string): void => {
    try {
      if (!roomId) {
        logger.warn("Join room event missing roomId");
        return;
      }
      
      if (!socket.rooms.has(roomId)) {
        socket.join(roomId);
        logger.debug(`Socket ${socket.id} (user: ${socket.userId}) joined room ${roomId}`);
      }
    } catch (error) {
      logger.error({ err: error }, "Error joining room");
    }
  });

  // Handle new message sent
  socket.on(SOCKET_NEW_MESSAGE, ({ message }: MessageEventData): void => {
    try {
      if (!message) {
        logger.warn("New message event missing message data");
        return;
      }
      
      const { conversationId } = message;
      const userId = socket.userId;
      
      // Emit to user's other devices
      io.to(userId).emit(SOCKET_MESSAGE_RECEIVED, message);
      
      // Emit to conversation room (for other participants)
      if (conversationId) {
        socket.to(conversationId).emit(SOCKET_MESSAGE_RECEIVED, message);
        logger.debug(`Message from ${userId} broadcasted to conversation ${conversationId}`);
      }
    } catch (error) {
      logger.error({ err: error }, "Error handling new message");
    }
  });

  // Handle new conversation created
  socket.on(SOCKET_NEW_CONVERSATION, async ({ conversationId }: NewConversationEventData): Promise<void> => {
    try {
      if (!conversationId) {
        logger.warn("New conversation event missing conversationId");
        return;
      }
      
      const userId = socket.userId;
      
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
  socket.on(SOCKET_MESSAGE_SEEN, ({ conversationId, messageId }: MessageSeenEventData): void => {
    try {
      if (!conversationId || !messageId) {
        logger.warn("Message seen event missing required data");
        return;
      }
      
      const userId = socket.userId;
      
      socket.to(conversationId).emit(SOCKET_MESSAGE_SEEN_UPDATE, {
        conversationId,
        messageId,
        userId,
      });
      logger.debug(`Message ${messageId} marked as seen by user ${userId}`);
    } catch (error) {
      logger.error({ err: error }, "Error marking message as seen");
    }
  });

  // Handle all messages in conversation marked as seen
  socket.on(SOCKET_CONVERSATION_MESSAGES_SEEN, ({ conversationId }: ConversationMessagesSeenEventData): void => {
    try {
      if (!conversationId) {
        logger.warn("Conversation messages seen event missing conversationId");
        return;
      }
      
      const userId = socket.userId;
      
      socket.to(conversationId).emit(SOCKET_CONVERSATION_MESSAGES_SEEN_UPDATE, {
        conversationId,
        userId,
      });
      logger.debug(`All messages in conversation ${conversationId} marked as seen by user ${userId}`);
    } catch (error) {
      logger.error({ err: error }, "Error marking conversation messages as seen");
    }
  });
};