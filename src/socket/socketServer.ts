import { Server, Socket } from "socket.io";
import {
  SOCKET_CONNECTION,
  SOCKET_DISCONNECT,
  SOCKET_ONLINE_USERS,
} from "./utils/socketConstants.js";
import logger from "../utils/logger.js";
import {
  getOnlineUserIds,
  cleanupStaleEntries,
  clearAllMemoryData,
  onlineUsers,
} from "./utils/socketHelpers.js";
import { CLEANUP_INTERVAL, STALE_THRESHOLD } from "../config/envConfig.js";
import { registerPresenceHandlers } from "./handlers/presence.handlers.js";
import { registerChatHandlers } from "./handlers/chat.handlers.js";
import { registerTypingHandlers } from "./handlers/typing.handlers.js";
import { registerCallHandlers } from "./handlers/call.handlers.js";
import { handleDisconnect } from "./handlers/disconnect.handler.js";
import { authenticateSocket, CustomSocket } from "./utils/socketAuth.js";
import type { Server as HTTPServer } from "http";

// Store io instance for access from controllers
let ioInstance: Server | null = null;

export const getIO = (): Server | null => ioInstance;

export const initSocketServer = (server: HTTPServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  ioInstance = io;

  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on(SOCKET_CONNECTION, (socket: Socket) => {
    // Cast to CustomSocket after authentication
    const customSocket = socket as CustomSocket;
    
    logger.debug({ socketId: customSocket.id, userId: customSocket.userId }, "User connected");

    // Register all event handlers
    registerPresenceHandlers(io, customSocket);
    registerChatHandlers(io, customSocket);
    registerTypingHandlers(io, customSocket);
    registerCallHandlers(io, customSocket);

    // Handle socket disconnection
    customSocket.on(SOCKET_DISCONNECT, () => handleDisconnect(io, customSocket));
  });

  // Start periodic cleanup
  const cleanupInterval = setInterval(() => {
    const beforeCount = onlineUsers.size;
    cleanupStaleEntries(STALE_THRESHOLD);
    const afterCount = onlineUsers.size;
    
    // Only broadcast if users were cleaned up
    if (beforeCount !== afterCount) {
      const onlineUserIds = getOnlineUserIds();
      io.emit(SOCKET_ONLINE_USERS, onlineUserIds);
    }
  }, CLEANUP_INTERVAL);

  // Store cleanup interval for graceful shutdown
  (io as any).cleanupInterval = cleanupInterval;

  logger.info("Socket.IO server initialized successfully");
  return io;
};

export const closeSocketServer = async (io: Server): Promise<void> => {
  return new Promise((resolve) => {
    // Stop accepting new connections
    const cleanupInterval = (io as any).cleanupInterval;
    if (cleanupInterval) clearInterval(cleanupInterval);

    // Disconnect all clients
    io.disconnectSockets();
    
    // Clear memory
    clearAllMemoryData();
    
    // Clear io instance
    ioInstance = null;
    
    // Close server
    io.close(() => {
      logger.info("Socket.IO server closed");
      resolve();
    });
  });
};
