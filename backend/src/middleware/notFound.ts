import { Request, Response, NextFunction } from 'express';

/**
 * 404 Not Found handler — must be placed AFTER all routes.
 */
export const notFound = (req: Request, res: Response, _next: NextFunction): void => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
};
