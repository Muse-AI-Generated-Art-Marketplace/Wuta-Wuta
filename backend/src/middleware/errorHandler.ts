import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Centralised error handler.
 * Returns a consistent JSON error shape: { success, error, message }.
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const statusCode = err.statusCode ?? 500;
  const isDev = process.env.NODE_ENV !== 'production';

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, err);

  res.status(statusCode).json({
    success: false,
    error: err.name || 'Error',
    message: isDev || err.isOperational ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
};

/** Helper to create typed operational errors. */
export const createError = (message: string, statusCode = 500): AppError => {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
};
