import type { Response } from "express";
import type { PaginationMeta } from "../../modules/transaction/transaction.type.js";

interface SuccessResponse<T> {
  success: true;
  data: T;
  error: null;
  meta?: PaginationMeta;
}

interface ErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta,
): void {
  const body: SuccessResponse<T> = { success: true, data, error: null };
  if (meta) body.meta = meta;
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  const body: ErrorResponse = {
    success: false,
    data: null,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
  res.status(statusCode).json(body);
}
