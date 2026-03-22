import { describe, it, expect, vi } from 'vitest';
import { type Request, type Response, type NextFunction } from 'express';
import { asyncHandler } from './async-handler.js';

const makeExpressArgs = () => ({
  req: {} as Request,
  res: {} as Response,
  next: vi.fn() as unknown as NextFunction,
});

describe('asyncHandler', () => {
  it('should call the wrapped function with req, res, and next', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const handler = asyncHandler(fn);
    const { req, res, next } = makeExpressArgs();

    handler(req, res, next);
    await vi.waitFor(() => expect(fn).toHaveBeenCalledWith(req, res, next));
  });

  it('should call next(error) when the wrapped function throws', async () => {
    const error = new Error('Something failed');
    const fn = vi.fn().mockRejectedValue(error);
    const handler = asyncHandler(fn);
    const { req, res, next } = makeExpressArgs();

    handler(req, res, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalledWith(error));
  });

  it('should NOT call next when the wrapped function resolves successfully', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const handler = asyncHandler(fn);
    const { req, res, next } = makeExpressArgs();

    handler(req, res, next);
    await vi.waitFor(() => expect(fn).toHaveBeenCalled());
    expect(next).not.toHaveBeenCalled();
  });
});
