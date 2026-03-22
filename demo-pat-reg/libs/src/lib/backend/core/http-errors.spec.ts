import { describe, it, expect } from 'vitest';
import { httpErrors } from './http-errors.js';
import { AppError } from './app-error.js';

describe('httpErrors', () => {
  it.each([
    ['badRequest',           400, 'Bad Request'],
    ['unauthorized',         401, 'Unauthorized'],
    ['forbidden',            403, 'Forbidden'],
    ['notFound',             404, 'Not Found'],
    ['conflict',             409, 'Conflict'],
    ['unprocessableEntity',  422, 'Unprocessable Entity'],
    ['internal',             500, 'Internal Server Error'],
  ] as const)('%s() returns an AppError with the correct status and default message', (factory, status, defaultMsg) => {
    const error = httpErrors[factory]();
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(status);
    expect(error.message).toBe(defaultMsg);
  });

  it('should use a custom message when provided', () => {
    const error = httpErrors.notFound('Visit not found');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Visit not found');
  });

  it('should use a custom message for any factory', () => {
    const error = httpErrors.conflict('Patient already has an open visit with this doctor');
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Patient already has an open visit with this doctor');
  });
});
