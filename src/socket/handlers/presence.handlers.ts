import { Server } from "socket.io";
import { Types } from "mongoose";
import {
  SOCKET_SETUP,
  SOCKET_ONLINE_USERS,
  SOCKET_BULK_MESSAGES_DELIVERED,
} from "../utils/socketConstants.js";
import logger from "../../utils/logger.js";
import {
  addUserSocket,
  getOnlineUserIds,
} from "../utils/socketHelpers.js";
import { CustomSocket } from "../utils/socketAuth.js";
import { markPendingMessagesAsDelivered } from "../../services/message.service.js";
import { emitBulkMessagesDelivered } from "../../services/socket.service.js";
import Conversation from "../../models/conversation.model.js";

export const registerPresenceHandlers = (io: Server, socket: CustomSocket): void => {
  
  // Handle user setup - when user connects and identifies themselves
  socket.on(SOCKET_SETUP, async (): Promise<void> => {
    try {
      const userId = socket.userId;

      if (!userId) {
        logger.warn({ socketId: socket.id }, "Setup attempted without userId");
        return;
      }

      addUserSocket(userId, socket.id);
      socket.join(userId);
      
      const conversations = await Conversation.find(
        { participants: userId },
        { _id: 1 }
      ).lean<Array<{ _id: Types.ObjectId }>>();
      conversations.forEach(conv => socket.join(conv._id.toString()));
      
      // Mark pending messages as delivered and notify senders
      markPendingMessagesAsDelivered(userId)
        .then((deliveredMessages: Array<{ messageId: string; conversationId: string }>) => {
          if (deliveredMessages.length > 0) {
            // Send list to client so it knows which messages were bulk-delivered
            socket.emit(SOCKET_BULK_MESSAGES_DELIVERED, { 
              messageIds: deliveredMessages.map(m => m.messageId) 
            });
            
            // Group by conversation for efficient notification
            const grouped = new Map<string, string[]>();
            deliveredMessages.forEach(({ messageId, conversationId }) => {
              if (!grouped.has(conversationId)) {
                grouped.set(conversationId, []);
              }
              grouped.get(conversationId)!.push(messageId);
            });
            
            // Emit batched notifications per conversation
            emitBulkMessagesDelivered(grouped, userId);
            
            logger.debug({ userId, count: deliveredMessages.length, conversations: grouped.size }, "Bulk messages delivered");
          }
        })
        .catch(err => 
          logger.error({ err, userId }, "Failed to mark messages as delivered")
        );
      
      const onlineUserIds = getOnlineUserIds();
      logger.debug({ userId, socketId: socket.id, onlineCount: onlineUserIds.length }, "User setup completed");

      // Only broadcast when user connects (optimization)
      socket.broadcast.emit(SOCKET_ONLINE_USERS, onlineUserIds);
      socket.emit(SOCKET_ONLINE_USERS, onlineUserIds);
    } catch (error) {
      logger.error({ err: error, socketId: socket.id, userId: socket.userId }, "Error in user setup");
    }
  });
};