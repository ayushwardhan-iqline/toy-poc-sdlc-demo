import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './app-error.js';

/**
 * Global Express error-handling middleware.
 *
 * Mount LAST in main.ts (after all routes):
 *   app.use(globalErrorHandler);
 *
 * Handles:
 *   - ZodError      → 400 Validation Error
 *   - AppError      → uses AppError.statusCode (e.g. 404, 403)
 *   - unknown       → 500 Internal Server Error
 *
 * All HTTP handlers simply call `next(error)` and this middleware
 * takes care of the rest — no manual error formatting in handlers.
 */
export const globalErrorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  // Express requires a 4-argument signature to recognise this as an error handler.
  // The parameter must be declared even if unused.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      details: error.issues,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  // Unexpected / untyped errors — log server-side only, never leak internals
  // eslint-disable-next-line no-console
  console.error('[globalErrorHandler] Unexpected error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
};
