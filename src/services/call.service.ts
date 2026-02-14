import { Types } from "mongoose";
import Call from "../models/call.model.js";
import AppError from "../utils/appError.js";
import logger from "../utils/logger.js";
import { ICall } from "../types/models.js";
import { CallWithPopulatedUsers } from "../types/service.js";
import { HTTP_MESSAGES, CALL_STATUS, CallStatusType, POPULATE_PATHS, USER_SELECT_FIELDS } from "../config/constants.js";

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
      status: CALL_STATUS.CALLING,
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
    .populate(POPULATE_PATHS.CALLER, USER_SELECT_FIELDS)
    .populate(POPULATE_PATHS.RECEIVER, USER_SELECT_FIELDS)
    .lean<CallWithPopulatedUsers>();

  if (!call) throw new AppError("Call " + HTTP_MESSAGES.ERROR.NOT_FOUND, 404);
  return call;
};

export const updateCallStatus = async (
  callId: string,
  status: CallStatusType,
  additionalData: Record<string, any> = {}
): Promise<ICall | null> => {
  try {
    const update: any = { status, ...additionalData };

    if (status === CALL_STATUS.ACCEPTED) {
      update.startedAt = new Date();
    }

    if (status === CALL_STATUS.ENDED || status === CALL_STATUS.DECLINED || status === CALL_STATUS.MISSED) {
      update.endedAt = new Date();
      
      if (status === CALL_STATUS.ENDED) {
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

export const markCallAsMissed = async (
  callId: string
): Promise<ICall | null> => {
  return await updateCallStatus(callId, CALL_STATUS.MISSED);
};
