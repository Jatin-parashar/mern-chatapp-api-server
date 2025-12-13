import { Server } from "socket.io";
import {
  SOCKET_TYPING,
  SOCKET_STOP_TYPING,
} from "../utils/socketConstants.js";
import logger from "../../utils/logger.js";
import { CustomSocket } from "../utils/socketAuth.js";
import { validateSocketEvent } from "../utils/socketValidation.js";
import { logSocketAction } from "../../utils/logHelpers.js";

interface TypingEventData {
  conversationId: string;
}

export const registerTypingHandlers = (io: Server, socket: CustomSocket): void => {
  
  // Handle typing start
  socket.on(SOCKET_TYPING, ({ conversationId }: TypingEventData): void => {
    try {
      if (!validateSocketEvent({ conversationId }, "conversationId")) return;
      
      const userId = socket.userId;
      
      // Broadcast to all other participants in the conversation
      socket.to(conversationId).emit(SOCKET_TYPING, { userId, conversationId });
      logSocketAction(userId, "started typing", conversationId);
    } catch (error) {
      logger.error({ err: error }, "Error handling typing event");
    }
  });

  // Handle typing stop
  socket.on(SOCKET_STOP_TYPING, ({ conversationId }: TypingEventData): void => {
    try {
      if (!validateSocketEvent({ conversationId }, "conversationId")) return;
      
      const userId = socket.userId;
      
      // Broadcast to all other participants in the conversation
      socket.to(conversationId).emit(SOCKET_STOP_TYPING, { userId, conversationId });
      logSocketAction(userId, "stopped typing", conversationId);
    } catch (error) {
      logger.error({ err: error }, "Error handling stop typing event");
    }
  });
};