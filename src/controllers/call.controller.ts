import { Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import { getCallById as getCall } from "../services/call.service.js";
import { AuthRequest } from "../types/express.js";
import Call from "../models/call.model.js";
import { buildPaginatedQuery } from "../utils/queryBuilder.js";
import { CALL_STATUS, POPULATE_PATHS, USER_SELECT_FIELDS, SUCCESS_MESSAGES } from "../config/constants.js";

export const getCallHistory = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await buildPaginatedQuery(
    Call,
    req.query,
    {
      filter: {
        $or: [{ caller: req.user!._id }, { receiver: req.user!._id }],
        status: { $in: [CALL_STATUS.ENDED, CALL_STATUS.DECLINED, CALL_STATUS.MISSED] },
      },
      populate: [
        { path: POPULATE_PATHS.CALLER, select: USER_SELECT_FIELDS },
        { path: POPULATE_PATHS.RECEIVER, select: USER_SELECT_FIELDS },
      ],
      sort: { createdAt: -1 },
      lean: true,
    }
  );

  sendSuccessResponse(res, 200, SUCCESS_MESSAGES.CALL_HISTORY_FETCHED, result);
});

export const getCallById = catchAsync(async (req: AuthRequest, res: Response) => {
  const call = await getCall(req.params.callId);

  sendSuccessResponse(res, 200, SUCCESS_MESSAGES.CALL_DETAILS_FETCHED, { call });
});
