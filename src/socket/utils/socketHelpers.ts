import { Server } from "socket.io";
import logger from "../../utils/logger.js";

// Store online users: Map<userId, socketId[]>
export const onlineUsers = new Map<string, string[]>();

// Track last seen timestamp for cleanup
export const userLastSeen = new Map<string, number>();

// Store active calls: Map<callId, callData>
export interface ActiveCallData {
  caller: string;
  receiver: string;
  isVideoCall: boolean;
  callerSocketId: string;
  receiverSocketId: string | null;
  status: string;
  createdAt: number;
  iceCount?: number;
  lastIceTime?: number;
}

export const activeCalls = new Map<string, ActiveCallData>();

// ICE candidate throttling
const ICE_THROTTLE_LIMIT = 50;
const ICE_THROTTLE_WINDOW = 1000; // 1 second

export const shouldThrottleICE = (callId: string): boolean => {
  const call = activeCalls.get(callId);
  if (!call) return true;

  const now = Date.now();
  if (!call.lastIceTime || now - call.lastIceTime > ICE_THROTTLE_WINDOW) {
    call.iceCount = 1;
    call.lastIceTime = now;
    return false;
  }

  call.iceCount = (call.iceCount || 0) + 1;
  return call.iceCount > ICE_THROTTLE_LIMIT;
};

export const formatOnlineUsersWithSockets = (): Record<string, string[]> => {
  const result: Record<string, string[]> = {};
  for (const [userId, sockets] of onlineUsers.entries()) {
    result[userId] = sockets;
  }
  return result;
};

export const getUserSocketIds = (userId: string): string[] => {
  return onlineUsers.get(userId) || [];
};

export const addUserSocket = (userId: string, socketId: string): void => {
  if (onlineUsers.has(userId)) {
    const sockets = onlineUsers.get(userId)!;
    if (!sockets.includes(socketId)) {
      sockets.push(socketId);
    }
  } else {
    onlineUsers.set(userId, [socketId]);
  }
  userLastSeen.set(socketId, Date.now());
  logger.debug(`Socket ${socketId} added for user ${userId}`);
};

export const removeUserSocket = (socketId: string): string | undefined => {
  let removedUserId: string | undefined = undefined;

  for (const [userId, sockets] of onlineUsers.entries()) {
    const filtered = sockets.filter((s) => s !== socketId);
    if (filtered.length !== sockets.length) {
      if (filtered.length > 0) {
        onlineUsers.set(userId, filtered);
      } else {
        onlineUsers.delete(userId);
        removedUserId = userId;
      }
    }
  }

  // Always clean up lastSeen for this socket
  userLastSeen.delete(socketId);

  if (removedUserId) {
    logger.debug(`User ${removedUserId} went offline (socket ${socketId} removed)`);
  }

  return removedUserId;
};

export const getOnlineUserIds = (): string[] => {
  return Array.from(onlineUsers.keys());
};

export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};

export const emitToUser = (
  io: Server, 
  userId: string, 
  event: string, 
  data: any
): boolean => {
  const socketIds = getUserSocketIds(userId);
  if (socketIds.length === 0) {
    logger.debug(`No active sockets for user ${userId}`);
    return false;
  }
  
  socketIds.forEach(socketId => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
    }
  });
  
  return true;
};

export const emitToUsers = (
  io: Server, 
  userIds: string[], 
  event: string, 
  data: any
): void => {
  userIds.forEach(userId => {
    emitToUser(io, userId, event, data);
  });
};

export const broadcastOnlineUsers = (io: Server, socketEvent: string): void => {
  const onlineUserIds = getOnlineUserIds();
  io.emit(socketEvent, onlineUserIds);
  logger.debug(`Broadcasted ${onlineUserIds.length} online users`);
};

export const storeActiveCall = (callId: string, callData: ActiveCallData): void => {
  activeCalls.set(callId, callData);
  logger.debug(`Active call stored: ${callId}`);
};

export const getActiveCall = (callId: string): ActiveCallData | undefined => {
  return activeCalls.get(callId);
};

export const updateActiveCall = (
  callId: string, 
  updates: Partial<ActiveCallData>
): ActiveCallData | null => {
  const call = activeCalls.get(callId);
  if (call) {
    const updated = { ...call, ...updates };
    activeCalls.set(callId, updated);
    return updated;
  }
  return null;
};

export const removeActiveCall = (callId: string): boolean => {
  const removed = activeCalls.delete(callId);
  if (removed) {
    logger.debug(`Active call removed: ${callId}`);
  }
  return removed;
};

export const findCallBySocketId = (
  socketId: string
): { callId: string; call: ActiveCallData } | null => {
  for (const [callId, call] of activeCalls.entries()) {
    if (call.callerSocketId === socketId || call.receiverSocketId === socketId) {
      return { callId, call };
    }
  }
  return null;
};

export const getActiveCallIds = (): string[] => {
  return Array.from(activeCalls.keys());
};

export const cleanupStaleEntries = (staleThreshold: number): void => {
  const now = Date.now();

  // Clean stale user sockets
  let cleanedSockets = 0;
  for (const [socketId, lastSeen] of userLastSeen.entries()) {
    if (now - lastSeen > staleThreshold) {
      userLastSeen.delete(socketId);
      removeUserSocket(socketId);
      cleanedSockets++;
    }
  }

  // Clean stale calls
  let cleanedCalls = 0;
  for (const [callId, call] of activeCalls.entries()) {
    if (now - call.createdAt > staleThreshold) {
      activeCalls.delete(callId);
      cleanedCalls++;
    }
  }

  if (cleanedSockets > 0 || cleanedCalls > 0) {
    logger.info(`Cleanup: ${cleanedSockets} sockets, ${cleanedCalls} calls`);
  }
};

export const clearAllMemoryData = (): void => {
  // Clear all call timeouts before clearing
  for (const [, call] of activeCalls.entries()) {
    if ((call as any).ringTimeout) clearTimeout((call as any).ringTimeout);
    if ((call as any).durationTimeout) clearTimeout((call as any).durationTimeout);
  }
  
  onlineUsers.clear();
  userLastSeen.clear();
  activeCalls.clear();
  logger.info("All in-memory data cleared");
};