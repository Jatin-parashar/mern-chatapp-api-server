import { Server } from "socket.io";
import {
  SOCKET_CALL_INITIATED,
  SOCKET_CALL_RECEIVED,
  SOCKET_CALL_ACCEPTED,
  SOCKET_CALL_DECLINED,
  SOCKET_CALL_ENDED,
  SOCKET_CALL_SIGNAL,
} from "../utils/socketConstants.js";
import logger from "../../utils/logger.js";
import {
  emitToUser,
  storeActiveCall,
  getActiveCall,
  updateActiveCall,
  removeActiveCall,
  shouldThrottleICE,
} from "../utils/socketHelpers.js";
import { clearCallTimeouts } from "../../utils/callHelpers.js";
import {
  createCall,
  updateCallStatus,
  markCallAsMissed,
} from "../../services/call.service.js";
import { CustomSocket } from "../utils/socketAuth.js";
import { CALL_RING_TIMEOUT, CALL_MAX_DURATION } from "../../config/envConfig.js";

interface CallerInfo {
  _id: string;
  name: string;
  username: string;
  profilePic?: string;
}

interface CallInitiatedEventData {
  callId: string;
  receiverId: string;
  callerInfo: CallerInfo;
  isVideoCall: boolean;
  signal: any;
}

interface CallAcceptedEventData {
  callId: string;
  signal: any;
}

interface CallDeclinedEventData {
  callId: string;
  reason?: string;
}

interface CallEndedEventData {
  callId: string;
}

interface CallSignalEventData {
  callId: string;
  signal: any;
}

export const registerCallHandlers = (io: Server, socket: CustomSocket): void => {
  // Handle call initiation
  socket.on(
    SOCKET_CALL_INITIATED,
    async ({
      callId,
      receiverId,
      callerInfo,
      isVideoCall,
      signal,
    }: CallInitiatedEventData): Promise<void> => {
      try {
        if (!callId || !receiverId || !callerInfo) {
          logger.warn("Call initiated event missing required data");
          return;
        }

        // Use authenticated userId from socket
        const callerId = socket.userId;

        // Validate caller info matches authenticated user
        if (callerInfo._id !== callerId) {
          logger.warn(`Caller info mismatch: ${callerInfo._id} vs ${callerId}`);
          socket.emit(SOCKET_CALL_DECLINED, {
            callId,
            reason: "Authentication error",
          });
          return;
        }

        // Validate caller isn't calling themselves
        if (callerId === receiverId) {
          logger.warn(`User ${callerId} attempted to call themselves`);
          socket.emit(SOCKET_CALL_DECLINED, {
            callId,
            reason: "Cannot call yourself",
          });
          return;
        }

        logger.debug(
          `Call initiated: ${callId} from ${callerId} to ${receiverId}`
        );

        // Store call in database
        await createCall(callId, callerId, receiverId, isVideoCall);

        // Store in active calls map
        storeActiveCall(callId, {
          caller: callerId,
          receiver: receiverId,
          isVideoCall,
          callerSocketId: socket.id,
          receiverSocketId: null,
          status: "calling",
          createdAt: Date.now(),
        });

        // Emit to receiver
        const emitted = emitToUser(io, receiverId, SOCKET_CALL_RECEIVED, {
          callId,
          callerInfo,
          isVideoCall,
          signal,
        });

        if (emitted) {
          logger.debug(`Call signal sent to receiver: ${receiverId}`);
          // Set ring timeout for no answer
          const ringTimeout = setTimeout(async () => {
            const call = getActiveCall(callId);
            if (call && call.status === "calling") {
              await markCallAsMissed(callId);
              removeActiveCall(callId);
              socket.emit(SOCKET_CALL_DECLINED, {
                callId,
                reason: "No answer",
              });
            }
          }, CALL_RING_TIMEOUT);
          
          updateActiveCall(callId, { ringTimeout } as any);
        } else {
          logger.warn(`Receiver ${receiverId} is offline`);
          // Immediately notify caller that receiver is offline
          await markCallAsMissed(callId);
          removeActiveCall(callId);
          socket.emit(SOCKET_CALL_DECLINED, {
            callId,
            reason: "User is offline",
          });
        }
      } catch (error) {
        logger.error(
          { err: error, callId },
          `Failed to initiate call`
        );
        socket.emit(SOCKET_CALL_DECLINED, { callId, reason: "error" });
      }
    }
  );

  // Handle call accepted
  socket.on(
    SOCKET_CALL_ACCEPTED,
    async ({ callId, signal }: CallAcceptedEventData): Promise<void> => {
      try {
        if (!callId || !signal) {
          logger.warn("Call accepted event missing required data");
          return;
        }

        const call = getActiveCall(callId);
        if (!call) {
          logger.error(`Call ${callId} not found when accepting`);
          return;
        }

        // Verify the user accepting is the receiver
        const userId = socket.userId;
        if (userId !== call.receiver) {
          logger.warn(`Unauthorized call accept attempt by ${userId} for call ${callId}`);
          return;
        }

        logger.debug(`Call accepted: ${callId}`);

        // Update call status in database
        await updateCallStatus(callId, "accepted");

        // Clear ring timeout if exists
        const existingCall = getActiveCall(callId);
        if (existingCall && (existingCall as any).ringTimeout) {
          clearTimeout((existingCall as any).ringTimeout);
        }

        // Update active call data
        updateActiveCall(callId, {
          status: "accepted",
          receiverSocketId: socket.id,
        });

        // Auto-end call after max duration
        const durationTimeout = setTimeout(async () => {
          const activeCall = getActiveCall(callId);
          if (activeCall) {
            logger.info(`Auto-ending call ${callId} after max duration`);
            await updateCallStatus(callId, "ended");
            emitToUser(io, call.caller, SOCKET_CALL_ENDED, { callId });
            emitToUser(io, call.receiver, SOCKET_CALL_ENDED, { callId });
            removeActiveCall(callId);
          }
        }, CALL_MAX_DURATION);
        
        // Store timeout for cleanup
        updateActiveCall(callId, { durationTimeout } as any);

        // Emit to caller
        emitToUser(io, call.caller, SOCKET_CALL_ACCEPTED, {
          callId,
          signal,
        });

        logger.debug(`Call acceptance signal sent to caller: ${call.caller}`);
      } catch (error) {
        logger.error({ err: error, callId }, `Failed to accept call`);
      }
    }
  );

  // Handle call declined
  socket.on(
    SOCKET_CALL_DECLINED,
    async ({ callId, reason }: CallDeclinedEventData): Promise<void> => {
      try {
        if (!callId) {
          logger.warn("Call declined event missing callId");
          return;
        }

        const call = getActiveCall(callId);
        if (!call) {
          logger.error(`Call ${callId} not found when declining`);
          return;
        }

        logger.debug(
          `Call declined: ${callId}, reason: ${reason || "user declined"}`
        );

        // Clear timeouts
        clearCallTimeouts(call);

        // Update call status in database
        await updateCallStatus(callId, "declined");

        // Emit to caller
        emitToUser(io, call.caller, SOCKET_CALL_DECLINED, { callId, reason });

        // Clean up active call
        removeActiveCall(callId);
        logger.debug(`Call ${callId} cleaned up after decline`);
      } catch (error) {
        logger.error(
          { err: error, callId },
          `Failed to decline call`
        );
      }
    }
  );

  // Handle call ended
  socket.on(
    SOCKET_CALL_ENDED,
    async ({ callId }: CallEndedEventData): Promise<void> => {
      try {
        if (!callId) {
          logger.warn("Call ended event missing callId");
          return;
        }

        const call = getActiveCall(callId);
        if (!call) {
          logger.error(`Call ${callId} not found when ending`);
          return;
        }

        logger.debug(`Call ended: ${callId}`);

        // Clear timeouts
        clearCallTimeouts(call);

        // Update call status in database (will calculate duration)
        await updateCallStatus(callId, "ended");

        // Emit to both participants
        emitToUser(io, call.caller, SOCKET_CALL_ENDED, { callId });
        emitToUser(io, call.receiver, SOCKET_CALL_ENDED, { callId });

        // Clean up active call
        removeActiveCall(callId);
        logger.debug(`Call ${callId} cleaned up after end`);
      } catch (error) {
        logger.error({ err: error, callId }, `Failed to end call`);
      }
    }
  );

  // Handle WebRTC signaling (ICE candidates, etc.)
  socket.on(
    SOCKET_CALL_SIGNAL,
    ({ callId, signal }: CallSignalEventData): void => {
      try {
        if (!callId || !signal) {
          logger.warn("Call signal event missing required data");
          return;
        }

        // Validate WebRTC signal structure
        if (signal.type && !['offer', 'answer'].includes(signal.type)) {
          if (!signal.candidate) {
            logger.warn("Invalid WebRTC signal structure");
            return;
          }
        }

        // Throttle ICE candidates
        if (signal.candidate && shouldThrottleICE(callId)) {
          logger.warn(`ICE candidate throttled for call ${callId}`);
          return;
        }

        const call = getActiveCall(callId);
        if (!call) {
          logger.error(`Call ${callId} not found when signaling`);
          return;
        }

        // Determine who to send the signal to
        const isFromCaller = socket.id === call.callerSocketId;
        const targetUserId = isFromCaller ? call.receiver : call.caller;

        logger.debug(`Forwarding signal for call ${callId} to ${targetUserId}`);

        // Forward signal to the other participant
        emitToUser(io, targetUserId, SOCKET_CALL_SIGNAL, {
          callId,
          signal,
        });
      } catch (error) {
        logger.error({ err: error }, "Error handling call signal");
      }
    }
  );
};