import type { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

export const sendError = (res: Response, message = "Internal Server Error", statusCode = 500, error: any = null) => {
  return res.status(statusCode).json({
    status: "error",
    message,
    ...(process.env.NODE_ENV !== 'production' && { details: error?.message || error }),
  });
};
