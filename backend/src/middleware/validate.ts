import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidateTarget = 'body' | 'params' | 'query';

/**
 * Middleware factory that validates request data against a Zod schema.
 *
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate ('body' | 'params' | 'query')
 */
export const validate =
  (schema: ZodSchema, target: ValidateTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      req[target] = schema.parse(req[target]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(422).json({
          success: false,
          error: 'ValidationError',
          message: 'Validation failed',
          details: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
