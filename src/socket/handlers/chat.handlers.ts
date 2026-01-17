import { Server } from "socket.io";
import { SOCKET_JOIN_ROOM } from "../utils/socketConstants.js";
import logger from "../../utils/logger.js";
import { CustomSocket } from "../utils/socketAuth.js";
import { validateSocketEvent } from "../utils/socketValidation.js";

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
};