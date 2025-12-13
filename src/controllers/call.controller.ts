import { Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import { getUserCallHistory, getCallById as getCall } from "../services/call.service.js";
import { AuthRequest } from "../types/express.js";
import Call from "../models/call.model.js";
import { parsePaginationParams, createPaginationResult } from "../utils/pagination.js";

export const getCallHistory = catchAsync(async (req: AuthRequest, res: Response) => {
  const { limit, skip } = parsePaginationParams(
    req.query.limit as string,
    req.query.skip as string
  );

  const [calls, total] = await Promise.all([
    getUserCallHistory(req.user!._id, limit, skip),
    Call.countDocuments({
      $or: [{ caller: req.user!._id }, { receiver: req.user!._id }],
      status: { $in: ["ended", "declined", "missed"] },
    })
  ]);

  const result = createPaginationResult(calls, total, limit, skip);
  sendSuccessResponse(res, 200, "Call history fetched successfully", result);
});

export const getCallById = catchAsync(async (req: AuthRequest, res: Response) => {
  const call = await getCall(req.params.callId);

  sendSuccessResponse(res, 200, "Call details fetched successfully", { call });
});
