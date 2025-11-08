import { Response } from "express";

interface ApiResponse<T = any> {
  status: "success";
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
    status: "success",
    message,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};