import { getIO } from "../socket/socketServer.js";
import { onlineUsers } from "../socket/utils/socketHelpers.js";
import { 
  SOCKET_MESSAGE_RECEIVED, 
  SOCKET_MESSAGE_SEEN_UPDATE, 
  SOCKET_CONVERSATION_MESSAGES_SEEN_UPDATE,
  SOCKET_MESSAGE_DELIVERED_UPDATE,
  SOCKET_NEW_CONVERSATION_RECEIVED 
} from "../socket/utils/socketConstants.js";
import { Types } from "mongoose";

export const emitNewMessage = (userId: string, conversationId: string, message: any): void => {
  const io = getIO();
  if (io) {
    io.to(userId).emit(SOCKET_MESSAGE_RECEIVED, message);
    io.to(conversationId).emit(SOCKET_MESSAGE_RECEIVED, message);
  }
};

export const notifyNewConversation = (conversation: any, excludeUserId: string): void => {
  const io = getIO();
  if (!io) return;

  conversation.participants.forEach((participant: any) => {
    const participantId = (participant._id as Types.ObjectId).toString();
    if (participantId !== excludeUserId) {
      const socketIds = onlineUsers.get(participantId);
      socketIds?.forEach((socketId) => {
        const socket = io.sockets.sockets.get(socketId);
        socket?.emit(SOCKET_NEW_CONVERSATION_RECEIVED, { conversation });
      });
    }
  });
};

export const emitMessageSeen = (conversationId: string, messageId: string, userId: string): void => {
  const io = getIO();
  io?.to(conversationId).emit(SOCKET_MESSAGE_SEEN_UPDATE, {
    conversationId,
    messageId,
    userId,
  });
};

export const emitConversationMessagesSeen = (conversationId: string, userId: string): void => {
  const io = getIO();
  io?.to(conversationId).emit(SOCKET_CONVERSATION_MESSAGES_SEEN_UPDATE, {
    conversationId,
    userId,
  });
};

export const emitMessageDelivered = (conversationId: string, messageId: string, userId: string): void => {
  const io = getIO();
  io?.to(conversationId).emit(SOCKET_MESSAGE_DELIVERED_UPDATE, {
    conversationId,
    messageId,
    userId,
  });
};

export const emitBulkMessagesDelivered = (deliveries: Map<string, string[]>, userId: string): void => {
  const io = getIO();
  if (!io) return;

  deliveries.forEach((messageIds, conversationId) => {
    io.to(conversationId).emit(SOCKET_MESSAGE_DELIVERED_UPDATE, {
      conversationId,
      messageIds,
      userId,
    });
  });
};

export const setupConversationRooms = (conversation: any, creatorId: string): void => {
  const io = getIO();
  if (!io) return;

  const conversationId = conversation._id.toString();
  
  conversation.participants.forEach((participant: any) => {
    const participantId = (participant._id as Types.ObjectId).toString();
    const socketIds = onlineUsers.get(participantId);

    socketIds?.forEach((socketId) => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(conversationId);
      }
    });
  });
};
