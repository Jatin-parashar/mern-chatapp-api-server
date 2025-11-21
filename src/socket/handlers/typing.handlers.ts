import { Server } from "socket.io";
import {
  SOCKET_TYPING,
  SOCKET_STOP_TYPING,
} from "../../constants/socketConstants.js";
import logger from "../../utils/logger.js";
import { CustomSocket } from "../utils/socketAuth.js";

interface TypingEventData {
  conversationId: string;
}

/**
 * Handle typing indicators for conversations
 */
export const registerTypingHandlers = (io: Server, socket: CustomSocket): void => {
  
  // Handle typing start
  socket.on(SOCKET_TYPING, ({ conversationId }: TypingEventData): void => {
    try {
      if (!conversationId) {
        logger.warn("Typing event missing conversationId");
        return;
      }
      
      const userId = socket.userId;
      
      // Broadcast to all other participants in the conversation
      socket.to(conversationId).emit(SOCKET_TYPING, { userId, conversationId });
      logger.debug(`User ${userId} started typing in conversation ${conversationId}`);
    } catch (error) {
      logger.error({ err: error }, "Error handling typing event");
    }
  });

  // Handle typing stop
  socket.on(SOCKET_STOP_TYPING, ({ conversationId }: TypingEventData): void => {
    try {
      if (!conversationId) {
        logger.warn("Stop typing event missing conversationId");
        return;
      }
      
      const userId = socket.userId;
      
      // Broadcast to all other participants in the conversation
      socket.to(conversationId).emit(SOCKET_STOP_TYPING, { userId, conversationId });
      logger.debug(`User ${userId} stopped typing in conversation ${conversationId}`);
    } catch (error) {
      logger.error({ err: error }, "Error handling stop typing event");
    }
  });
};