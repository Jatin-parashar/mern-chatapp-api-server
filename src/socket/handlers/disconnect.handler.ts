import { Server } from "socket.io";
import { CustomSocket } from "../utils/socketAuth.js";
import {
  removeUserSocket,
  getOnlineUserIds,
  findCallBySocketId,
  removeActiveCall,
  emitToUser,
  getActiveCallIds,
} from "../utils/socketHelpers.js";
import { updateCallStatus } from "../../services/call.service.js";
import { SOCKET_CALL_PEER_DISCONNECTED, SOCKET_CALL_ENDED, SOCKET_ONLINE_USERS } from "../utils/socketConstants.js";
import logger from "../../utils/logger.js";

const cleanupCall = async (io: Server, socket: CustomSocket, callId: string, call: any, otherUserId: string): Promise<void> => {
  try {
    // Clear timeouts
    if (call.ringTimeout) clearTimeout(call.ringTimeout);
    if (call.durationTimeout) clearTimeout(call.durationTimeout);
    
    // Fixed order: notify peer → update DB → remove from memory
    emitToUser(io, otherUserId, SOCKET_CALL_PEER_DISCONNECTED, { callId });
    emitToUser(io, otherUserId, SOCKET_CALL_ENDED, { callId });
    
    await updateCallStatus(callId, "ended");
    removeActiveCall(callId);
  } catch (error) {
    logger.error({ err: error, callId }, "Error cleaning up call");
    // Still notify peer and cleanup even if DB fails
    emitToUser(io, otherUserId, SOCKET_CALL_ENDED, { callId });
    removeActiveCall(callId);
  }
};

export const handleDisconnect = async (io: Server, socket: CustomSocket): Promise<void> => {
  logger.debug({ socketId: socket.id, userId: socket.userId }, "User disconnected");

  // Handle active calls cleanup
  const callInfo = findCallBySocketId(socket.id);
  if (callInfo) {
    const { callId, call } = callInfo;
    logger.debug({ callId, socketId: socket.id, userId: socket.userId }, "Cleaning up call due to disconnect");

    const otherUserId = call.callerSocketId === socket.id ? call.receiver : call.caller;
    await cleanupCall(io, socket, callId, call, otherUserId);
  }

  // Handle online users cleanup
  removeUserSocket(socket.id);

  const updatedOnlineUserIds = getOnlineUserIds();
  logger.debug({ 
    socketId: socket.id, 
    userId: socket.userId, 
    onlineCount: updatedOnlineUserIds.length,
    activeCallsCount: getActiveCallIds().length
  }, "Disconnect cleanup completed");

  // Broadcast user went offline
  io.emit(SOCKET_ONLINE_USERS, updatedOnlineUserIds);
};
