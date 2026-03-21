import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Higher-order function that wraps an async Express route handler and
 * automatically forwards any thrown errors to `next(error)`.
 *
 * Without this wrapper, every handler needs its own try-catch:
 *   async (req, res, next) => { try { ... } catch (e) { next(e); } }
 *
 * With asyncHandler, handlers are clean business-translation only:
 *   asyncHandler(async (req, res) => {
 *     const data = await myUseCase(input);
 *     res.json(data);
 *   });
 *
 * The globalErrorHandler (error-handler.middleware.ts) handles the rest.
 *
 * Note: Compatible with Express 4. Express 5 handles async errors natively,
 * so if/when upgraded, this wrapper can be removed with zero handler changes.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler =>
  (req, res, next) =>
    fn(req, res, next).catch(next);
