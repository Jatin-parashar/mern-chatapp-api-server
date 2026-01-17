import { Types } from "mongoose";
import Call from "../models/call.model.js";
import AppError from "../utils/appError.js";
import logger from "../utils/logger.js";
import { ICall } from "../types/models.js";
import { CallWithPopulatedUsers } from "../types/service.js";

export const createCall = async (
  callId: string,
  callerId: string | Types.ObjectId,
  receiverId: string | Types.ObjectId,
  isVideoCall: boolean
): Promise<ICall> => {
  try {
    const call = await Call.create({
      callId,
      caller: callerId,
      receiver: receiverId,
      isVideoCall,
      status: "calling",
      startedAt: new Date(),
    });
    logger.debug(`Call created in DB: ${callId}`);
    return call;
  } catch (error) {
    logger.error({ err: error }, `Failed to create call ${callId}`);
    throw error;
  }
};

export const getCallById = async (
  callId: string
): Promise<CallWithPopulatedUsers> => {
  const call = await Call.findOne({ callId })
    .populate("caller", "name username profilePic")
    .populate("receiver", "name username profilePic")
    .lean<CallWithPopulatedUsers>();

  if (!call) throw new AppError("Call not found", 404);
  return call;
};

export const updateCallStatus = async (
  callId: string,
  status: "calling" | "accepted" | "declined" | "ended" | "missed",
  additionalData: Record<string, any> = {}
): Promise<ICall | null> => {
  try {
    const update: any = { status, ...additionalData };

    // If call is accepted, update startedAt to actual call start
    if (status === "accepted") {
      update.startedAt = new Date();
    }

    // If call is ending, set endedAt and calculate duration
    if (status === "ended" || status === "declined" || status === "missed") {
      update.endedAt = new Date();
      
      // Calculate duration only for ended calls (not declined/missed)
      if (status === "ended") {
        const call = await Call.findOne({ callId });
        if (call && call.startedAt) {
          const duration = Math.floor((update.endedAt.getTime() - call.startedAt.getTime()) / 1000);
          update.duration = duration;
        }
      }
    }

    const call = await Call.findOneAndUpdate({ callId }, update, { new: true });

    if (call) {
      logger.debug(`Call ${callId} status updated to ${status}`);
    }

    return call;
  } catch (error) {
    logger.error({ err: error }, `Failed to update call ${callId}`);
    throw error;
  }
};

export const getUserCallHistory = async (
  userId: string | Types.ObjectId,
  limit?: number,
  skip?: number
): Promise<CallWithPopulatedUsers[]> => {
  let query = Call.find({
    $or: [{ caller: userId }, { receiver: userId }],
    status: { $in: ["ended", "declined", "missed"] },
  })
    .populate("caller", "name username profilePic")
    .populate("receiver", "name username profilePic")
    .sort({ createdAt: -1 });

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  if (skip !== undefined) {
    query = query.skip(skip);
  }

  return await query.lean<CallWithPopulatedUsers[]>();
};

export const markCallAsMissed = async (
  callId: string
): Promise<ICall | null> => {
  return await updateCallStatus(callId, "missed");
};
