import { Server, Socket } from "socket.io";
import {
  SOCKET_TYPING,
  SOCKET_STOP_TYPING,
} from "../../constants/socketConstants.js";
import logger from "../../utils/logger.js";

interface TypingEventData {
  conversationId: string;
  userId: string;
}

/**
 * Handle typing indicators for conversations
 */
export const registerTypingHandlers = (io: Server, socket: Socket): void => {
  
  // Handle typing start
  socket.on(SOCKET_TYPING, ({ conversationId, userId }: TypingEventData): void => {
    if (!conversationId || !userId) {
      logger.warn("Typing event missing conversationId or userId");
      return;
    }
    
    // Broadcast to all other participants in the conversation
    socket.to(conversationId).emit(SOCKET_TYPING, { userId, conversationId });
    logger.debug(`User ${userId} started typing in conversation ${conversationId}`);
  });

  // Handle typing stop
  socket.on(SOCKET_STOP_TYPING, ({ conversationId, userId }: TypingEventData): void => {
    if (!conversationId || !userId) {
      logger.warn("Stop typing event missing conversationId or userId");
      return;
    }
    
    // Broadcast to all other participants in the conversation
    socket.to(conversationId).emit(SOCKET_STOP_TYPING, { userId, conversationId });
    logger.debug(`User ${userId} stopped typing in conversation ${conversationId}`);
  });
};