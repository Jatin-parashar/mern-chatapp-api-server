import { Server, Socket } from "socket.io";
import {
  SOCKET_CONNECTION,
  SOCKET_DISCONNECT,
  SOCKET_ONLINE_USERS,
  SOCKET_CALL_PEER_DISCONNECTED,
  SOCKET_CALL_ENDED,
} from "../constants/socketConstants.js";
import logger from "../utils/logger.js";
import {
  removeUserSocket,
  getOnlineUserIds,
  formatOnlineUsersWithSockets,
  broadcastOnlineUsers,
  findCallBySocketId,
  removeActiveCall,
  emitToUser,
  getActiveCallIds,
} from "./utils/socketHelpers.js";
import { registerPresenceHandlers } from "./handlers/presence.handlers.js";
import { registerChatHandlers } from "./handlers/chat.handlers.js";
import { registerTypingHandlers } from "./handlers/typing.handlers.js";
import { registerCallHandlers } from "./handlers/call.handlers.js";
import { updateCallStatus } from "../services/call.service.js";
import { authenticateSocket, CustomSocket } from "./utils/socketAuth.js";
import type { Server as HTTPServer } from "http";

/**
 * Initialize Socket.IO server with all event handlers
 * @param server - HTTP server instance
 * @returns Configured Socket.IO server instance
 */
export const initSocketServer = (server: HTTPServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on(SOCKET_CONNECTION, (socket: Socket) => {
    // Cast to CustomSocket after authentication
    const customSocket = socket as CustomSocket;
    
    logger.debug(`User connected: ${customSocket.id} (user: ${customSocket.userId})`);

    // Register all event handlers
    registerPresenceHandlers(io, customSocket);
    registerChatHandlers(io, customSocket);
    registerTypingHandlers(io, customSocket);
    registerCallHandlers(io, customSocket);

    // Handle socket disconnection
    customSocket.on(SOCKET_DISCONNECT, async (): Promise<void> => {
      logger.debug(`User disconnected: ${customSocket.id} (user: ${customSocket.userId})`);

      // Handle active calls cleanup
      const callInfo = findCallBySocketId(customSocket.id);
      if (callInfo) {
        const { callId, call } = callInfo;
        logger.debug(`Cleaning up call ${callId} due to disconnect`);

        try {
          // Update call status in database FIRST
          await updateCallStatus(callId, "ended");

          // Remove the active call from memory
          removeActiveCall(callId);

          // THEN notify the other participant
          const otherUserId =
            call.callerSocketId === customSocket.id ? call.receiver : call.caller;
          emitToUser(io, otherUserId, SOCKET_CALL_PEER_DISCONNECTED, {
            callId,
          });
          emitToUser(io, otherUserId, SOCKET_CALL_ENDED, { callId });
        } catch (error) {
          logger.error(
            { err: error, callId },
            `Error cleaning up call ${callId}`
          );
          // Still remove from memory even if DB update fails
          removeActiveCall(callId);
        }
      }

      // Handle online users cleanup
      removeUserSocket(customSocket.id);

      const onlineUserIds: string[] = getOnlineUserIds();
      if (onlineUserIds.length === 0) {
        logger.debug("No users online.");
      } else {
        logger.debug(
          `Updated online users after disconnect: ${onlineUserIds.join(", ")}`
        );
      }

      logger.debug(
        { users: formatOnlineUsersWithSockets() },
        "Online users with sockets"
      );
      logger.debug(
        { activeCalls: getActiveCallIds() },
        "Active calls after disconnect"
      );

      // Broadcast updated online users list
      broadcastOnlineUsers(io, SOCKET_ONLINE_USERS);
    });
  });

  logger.info("Socket.IO server initialized successfully");
  return io;
};
