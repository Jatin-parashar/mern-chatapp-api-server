import { Server } from "socket.io";
import { SOCKET_JOIN_ROOM, SOCKET_MESSAGE_DELIVERED } from "../utils/socketConstants.js";
import logger from "../../utils/logger.js";
import { CustomSocket } from "../utils/socketAuth.js";
import { validateSocketEvent } from "../utils/socketValidation.js";
import { markMessageAsDelivered } from "../../services/message.service.js";
import { emitMessageDelivered } from "../../services/socket.service.js";

export const registerChatHandlers = (io: Server, socket: CustomSocket): void => {
  // Handle joining a conversation room
  socket.on(SOCKET_JOIN_ROOM, (roomId: string): void => {
    try {
      if (!validateSocketEvent({ roomId }, "roomId")) return;
      
      if (!socket.rooms.has(roomId)) {
        socket.join(roomId);
        logger.debug({ socketId: socket.id, userId: socket.userId, roomId }, "Socket joined room");
      }
    } catch (error) {
      logger.error({ err: error, socketId: socket.id, userId: socket.userId }, "Error joining room");
    }
  });

  // Handle message delivery confirmation
  socket.on(SOCKET_MESSAGE_DELIVERED, async (data: { messageId: string }): Promise<void> => {
    try {
      const { messageId } = data;
      const userId = socket.userId;

      if (!validateSocketEvent({ messageId }, "messageId")) return;

      const { conversationId, alreadyDelivered } = await markMessageAsDelivered(messageId, userId);

      // Only emit if not already delivered (avoids duplicate notifications)
      if (!alreadyDelivered) {
        emitMessageDelivered(conversationId, messageId, userId);
      }

      logger.debug({ messageId, userId, alreadyDelivered }, "Message marked as delivered");
    } catch (error) {
      logger.error({ err: error, socketId: socket.id, userId: socket.userId }, "Error marking message as delivered");
    }
  });
};