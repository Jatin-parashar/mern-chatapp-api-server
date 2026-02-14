import { Server } from "socket.io";
import { SOCKET_JOIN_ROOM, SOCKET_ERROR } from "../utils/socketConstants.js";
import logger from "../../utils/logger.js";
import { CustomSocket } from "../utils/socketAuth.js";
import { validateSocketEvent } from "../utils/socketValidation.js";
import { FORM_FIELDS } from "../../config/constants.js";

export const registerChatHandlers = (_io: Server, socket: CustomSocket): void => {
  // Handle joining a conversation room
  socket.on(SOCKET_JOIN_ROOM, (roomId: string): void => {
    try {
      if (!validateSocketEvent({ roomId }, FORM_FIELDS.ROOM_ID)) {
        socket.emit(SOCKET_ERROR, { message: "Invalid room ID" });
        return;
      }
      
      if (!socket.rooms.has(roomId)) {
        socket.join(roomId);
        logger.debug({ socketId: socket.id, userId: socket.userId, roomId }, "Socket joined room");
        socket.emit("room:joined", { roomId });
      }
    } catch (error) {
      logger.error({ err: error, socketId: socket.id, userId: socket.userId }, "Error joining room");
      socket.emit(SOCKET_ERROR, { message: "Failed to join room" });
    }
  });
};