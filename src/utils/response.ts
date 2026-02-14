import { Response } from "express";
import { RESPONSE_STATUS } from "../config/constants.js";

interface ApiResponse<T = any> {
  status: typeof RESPONSE_STATUS.SUCCESS;
  message: string;
  data?: T;
}

export const sendSuccessResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): void => {
  const response: ApiResponse<T> = {
    status: RESPONSE_STATUS.SUCCESS,
    message,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};