import { Server } from "socket.io";
import {
  SOCKET_TYPING,
  SOCKET_STOP_TYPING,
  SOCKET_ERROR,
} from "../utils/socketConstants.js";
import logger from "../../utils/logger.js";
import { CustomSocket } from "../utils/socketAuth.js";
import { validateSocketEvent } from "../utils/socketValidation.js";
import { logSocketAction } from "../../utils/logHelpers.js";
import { FORM_FIELDS, SOCKET_ACTIONS } from "../../config/constants.js";

interface TypingEventData {
  conversationId: string;
}

export const registerTypingHandlers = (_io: Server, socket: CustomSocket): void => {
  
  // Handle typing start
  socket.on(SOCKET_TYPING, ({ conversationId }: TypingEventData): void => {
    try {
      if (!validateSocketEvent({ conversationId }, FORM_FIELDS.CONVERSATION_ID)) {
        socket.emit(SOCKET_ERROR, { message: "Invalid conversation ID" });
        return;
      }
      
      const userId = socket.userId;
      
      // Broadcast to all other participants in the conversation
      socket.to(conversationId).emit(SOCKET_TYPING, { userId, conversationId });
      logSocketAction(userId, SOCKET_ACTIONS.STARTED_TYPING, conversationId);
    } catch (error) {
      logger.error({ err: error }, "Error handling typing event");
      socket.emit(SOCKET_ERROR, { message: "Failed to process typing event" });
    }
  });

  // Handle typing stop
  socket.on(SOCKET_STOP_TYPING, ({ conversationId }: TypingEventData): void => {
    try {
      if (!validateSocketEvent({ conversationId }, FORM_FIELDS.CONVERSATION_ID)) {
        socket.emit(SOCKET_ERROR, { message: "Invalid conversation ID" });
        return;
      }
      
      const userId = socket.userId;
      
      // Broadcast to all other participants in the conversation
      socket.to(conversationId).emit(SOCKET_STOP_TYPING, { userId, conversationId });
      logSocketAction(userId, SOCKET_ACTIONS.STOPPED_TYPING, conversationId);
    } catch (error) {
      logger.error({ err: error }, "Error handling stop typing event");
      socket.emit(SOCKET_ERROR, { message: "Failed to process stop typing event" });
    }
  });
};