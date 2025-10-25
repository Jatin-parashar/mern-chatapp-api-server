import { Server } from "socket.io";
import logger from "../../utils/logger.js";

/**
 * Socket helper utilities for managing connections and emissions
 */

// Store online users: Map<userId, socketId[]>
export const onlineUsers = new Map<string, string[]>();

// Store active calls: Map<callId, callData>
export interface ActiveCallData {
  caller: string;
  receiver: string;
  isVideoCall: boolean;
  callerSocketId: string;
  receiverSocketId: string | null;
  status: string;
}

export const activeCalls = new Map<string, ActiveCallData>();

/**
 * Format online users map for logging
 */
export const formatOnlineUsersWithSockets = (): Record<string, string[]> => {
  const result: Record<string, string[]> = {};
  for (const [userId, sockets] of onlineUsers.entries()) {
    result[userId] = sockets;
  }
  return result;
};

/**
 * Get all socket IDs for a user
 */
export const getUserSocketIds = (userId: string): string[] => {
  return onlineUsers.get(userId) || [];
};

/**
 * Add a socket for a user
 */
export const addUserSocket = (userId: string, socketId: string): void => {
  if (onlineUsers.has(userId)) {
    const sockets = onlineUsers.get(userId)!;
    if (!sockets.includes(socketId)) {
      sockets.push(socketId);
    }
  } else {
    onlineUsers.set(userId, [socketId]);
  }
  logger.debug(`Socket ${socketId} added for user ${userId}`);
};

/**
 * Remove a socket for a user
 */
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
  
  if (removedUserId) {
    logger.debug(`User ${removedUserId} went offline (socket ${socketId} removed)`);
  }
  
  return removedUserId;
};

/**
 * Get all online user IDs
 */
export const getOnlineUserIds = (): string[] => {
  return Array.from(onlineUsers.keys());
};

/**
 * Check if a user is online
 */
export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};

/**
 * Emit event to all sockets of a specific user
 */
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

/**
 * Emit event to multiple users
 */
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

/**
 * Emit online users list to all connected clients
 */
export const broadcastOnlineUsers = (io: Server, socketEvent: string): void => {
  const onlineUserIds = getOnlineUserIds();
  io.emit(socketEvent, onlineUserIds);
  logger.debug(`Broadcasted ${onlineUserIds.length} online users`);
};

/**
 * Store active call data
 */
export const storeActiveCall = (callId: string, callData: ActiveCallData): void => {
  activeCalls.set(callId, callData);
  logger.debug(`Active call stored: ${callId}`);
};

/**
 * Get active call data
 */
export const getActiveCall = (callId: string): ActiveCallData | undefined => {
  return activeCalls.get(callId);
};

/**
 * Update active call data
 */
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

/**
 * Remove active call
 */
export const removeActiveCall = (callId: string): boolean => {
  const removed = activeCalls.delete(callId);
  if (removed) {
    logger.debug(`Active call removed: ${callId}`);
  }
  return removed;
};

/**
 * Find call by socket ID
 */
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

/**
 * Get all active call IDs
 */
export const getActiveCallIds = (): string[] => {
  return Array.from(activeCalls.keys());
};