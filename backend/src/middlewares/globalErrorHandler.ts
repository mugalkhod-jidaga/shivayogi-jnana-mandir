import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
}
