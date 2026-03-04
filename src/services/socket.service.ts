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
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import logger from "../utils/logger.js";

export const emitNewMessage = async (userId: string, conversationId: string, message: any): Promise<void> => {
  const io = getIO();
  if (!io) return;

  // Emit message to conversation room only (sender is already in the room)
  io.to(conversationId).emit(SOCKET_MESSAGE_RECEIVED, message);

  // Auto-mark as delivered for online recipients
  try {
    const conversation = await Conversation.findById(conversationId, { participants: 1 }).lean<{ _id: Types.ObjectId; participants: Types.ObjectId[] }>();
    if (!conversation) return;

    const onlineRecipients: string[] = [];
    
    conversation.participants.forEach((participantId) => {
      const pId = participantId.toString();
      // Skip sender, only mark for online recipients
      if (pId !== userId && onlineUsers.has(pId)) {
        onlineRecipients.push(pId);
      }
    });

    if (onlineRecipients.length > 0) {
      // Update DB: Mark as delivered for all online recipients
      await Message.findByIdAndUpdate(message._id, {
        $addToSet: { deliveredTo: { $each: onlineRecipients } }
      });

      // Emit delivery updates
      onlineRecipients.forEach(recipientId => {
        io.to(conversationId).emit(SOCKET_MESSAGE_DELIVERED_UPDATE, {
          conversationId,
          messageId: message._id,
          userId: recipientId,
        });
      });

      logger.debug({ messageId: message._id, recipients: onlineRecipients.length }, "Message auto-delivered to online users");
    }
  } catch (error) {
    logger.error({ err: error, messageId: message._id }, "Failed to auto-mark message as delivered");
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

export const setupConversationRooms = (conversation: any, _creatorId: string): void => {
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
