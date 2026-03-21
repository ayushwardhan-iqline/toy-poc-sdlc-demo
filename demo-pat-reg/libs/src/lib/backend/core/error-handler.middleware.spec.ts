import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest';
import { z } from 'zod';
import { type Request, type Response, type NextFunction } from 'express';
import { globalErrorHandler } from './error-handler.middleware.js';
import { AppError } from './app-error.js';

/**
 * Helper: produce a real ZodError by parsing an intentionally invalid value.
 * This avoids manually constructing ZodIssue objects whose shape changes across Zod versions.
 */
const makeZodError = (): z.ZodError => {
  const result = z.object({ page: z.number() }).safeParse({ page: 'not-a-number' });
  if (!result.success) return result.error;
  throw new Error('Expected parse to fail');
};

describe('globalErrorHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: MockInstance;
  let mockStatus: MockInstance;

  beforeEach(() => {
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockReq = {};
    mockRes = {
      status: mockStatus as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      json: mockJson as any,     // eslint-disable-line @typescript-eslint/no-explicit-any
    };
    mockNext = vi.fn() as unknown as NextFunction;
  });

  it('should return 400 with validation details when a ZodError is thrown', () => {
    const zodError = makeZodError();

    globalErrorHandler(zodError, mockReq as Request, mockRes as Response, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      error: 'Validation Error',
      details: zodError.issues,
    });
  });

  it('should return the AppError statusCode and message for a 404 AppError', () => {
    const appError = new AppError(404, 'Visit not found');

    globalErrorHandler(appError, mockReq as Request, mockRes as Response, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Visit not found' });
  });

  it('should return 403 for a forbidden AppError', () => {
    const appError = new AppError(403, 'Access denied');

    globalErrorHandler(appError, mockReq as Request, mockRes as Response, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Access denied' });
  });

  it('should return 500 for any unknown/unexpected error and not leak internals', () => {
    const unknownError = new Error('Something exploded in the database');

    globalErrorHandler(unknownError, mockReq as Request, mockRes as Response, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    // Ensure the raw error message is NOT returned to the client
    expect(mockJson).not.toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Something exploded in the database' }),
    );
  });

  it('should return 500 for a thrown non-Error value (e.g. a plain string)', () => {
    globalErrorHandler('oops', mockReq as Request, mockRes as Response, mockNext);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
