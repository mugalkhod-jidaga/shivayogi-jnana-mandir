import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

export function validateZod<T>(schema: ZodType<T>, source: 'body' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(source === 'body' ? req.body : req.query);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    if (source === 'body') {
      req.body = result.data;
    } else {
      (req as Request & { validatedQuery: T }).validatedQuery = result.data;
    }
    next();
  };
}
