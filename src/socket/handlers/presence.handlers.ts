import { Server } from "socket.io";
import {
  SOCKET_SETUP,
  SOCKET_ONLINE_USERS,
} from "../utils/socketConstants.js";
import logger from "../../utils/logger.js";
import {
  addUserSocket,
  getOnlineUserIds,
} from "../utils/socketHelpers.js";
import { CustomSocket } from "../utils/socketAuth.js";
import { markPendingMessagesAsDelivered } from "../../services/message.service.js";
import { emitMessageDelivered } from "../../services/socket.service.js";

export const registerPresenceHandlers = (io: Server, socket: CustomSocket): void => {
  
  // Handle user setup - when user connects and identifies themselves
  socket.on(SOCKET_SETUP, (): void => {
    try {
      const userId = socket.userId;

      if (!userId) {
        logger.warn({ socketId: socket.id }, "Setup attempted without userId");
        return;
      }

      // Add user socket to online users
      addUserSocket(userId, socket.id);
      
      // Join user's personal room for direct messages
      socket.join(userId);
      
      // Mark pending messages as delivered and emit events
      markPendingMessagesAsDelivered(userId)
        .then(deliveredMessages => {
          deliveredMessages.forEach(({ messageId, conversationId }) => {
            emitMessageDelivered(conversationId, messageId, userId);
          });
        })
        .catch(err => 
          logger.error({ err, userId }, "Failed to mark messages as delivered")
        );
      
      const onlineUserIds = getOnlineUserIds();
      logger.debug({ userId, socketId: socket.id, onlineCount: onlineUserIds.length }, "User setup completed");

      // Only broadcast when user connects (optimization)
      socket.broadcast.emit(SOCKET_ONLINE_USERS, onlineUserIds);
      socket.emit(SOCKET_ONLINE_USERS, onlineUserIds);
    } catch (error) {
      logger.error({ err: error, socketId: socket.id, userId: socket.userId }, "Error in user setup");
    }
  });
};