import { Server } from "socket.io";
import {
  SOCKET_SETUP,
  SOCKET_ONLINE_USERS,
} from "../../constants/socketConstants.js";
import logger from "../../utils/logger.js";
import {
  addUserSocket,
  formatOnlineUsersWithSockets,
  getOnlineUserIds,
  broadcastOnlineUsers,
} from "../utils/socketHelpers.js";
import { CustomSocket } from "../utils/socketAuth.js";

/**
 * Handle user presence (online/offline status)
 */
export const registerPresenceHandlers = (io: Server, socket: CustomSocket): void => {
  
  // Handle user setup - when user connects and identifies themselves
  socket.on(SOCKET_SETUP, (): void => {
    try {
      const userId = socket.userId;

      if (!userId) {
        logger.warn(`Setup attempted without userId on socket ${socket.id}`);
        return;
      }

      // Add user socket to online users
      addUserSocket(userId, socket.id);
      
      // Join user's personal room for direct messages
      socket.join(userId);
      
      const onlineUserIds = getOnlineUserIds();
      logger.debug(`User setup: ${userId}, online users: ${onlineUserIds.join(", ")}`);
      logger.debug({ users: formatOnlineUsersWithSockets() }, "Online users with sockets");

      // Broadcast updated online users list to all clients
      broadcastOnlineUsers(io, SOCKET_ONLINE_USERS);
    } catch (error) {
      logger.error({ err: error }, "Error in user setup");
    }
  });
};