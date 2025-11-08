import { Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import { getUserCallHistory, getCallById as getCall } from "../services/call.service.js";
import { AuthRequest } from "../types/express.js";

/**
 * Get call history for the authenticated user
 */
export const getCallHistory = catchAsync(async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const calls = await getUserCallHistory(req.user!._id, limit);

  sendSuccessResponse(res, 200, "Call history fetched successfully", {
    calls,
    count: calls.length,
  });
});

/**
 * Get specific call details by callId
 */
export const getCallById = catchAsync(async (req: AuthRequest, res: Response) => {
  const call = await getCall(req.params.callId);

  sendSuccessResponse(res, 200, "Call details fetched successfully", { call });
});
