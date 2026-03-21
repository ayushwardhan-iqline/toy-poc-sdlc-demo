import { AppError } from './app-error.js';

/**
 * Ergonomic HTTP error factories for use in use-cases and handlers.
 *
 * Usage:
 *   throw httpErrors.notFound('Visit not found');
 *   throw httpErrors.forbidden('Access denied');
 *
 * The globalErrorHandler converts these into the correct HTTP responses.
 * Status codes live here — call-sites read like plain English.
 */
export const httpErrors = {
  /** 400 Bad Request — invalid input that isn't a Zod schema error */
  badRequest: (message = 'Bad Request') => new AppError(400, message),

  /** 401 Unauthorized — not authenticated */
  unauthorized: (message = 'Unauthorized') => new AppError(401, message),

  /** 403 Forbidden — authenticated but lacks permission */
  forbidden: (message = 'Forbidden') => new AppError(403, message),

  /** 404 Not Found — resource does not exist */
  notFound: (message = 'Not Found') => new AppError(404, message),

  /** 409 Conflict — state violation (e.g. duplicate, already-open visit) */
  conflict: (message = 'Conflict') => new AppError(409, message),

  /** 422 Unprocessable Entity — semantically invalid request */
  unprocessableEntity: (message = 'Unprocessable Entity') => new AppError(422, message),

  /** 500 Internal Server Error — unexpected failure (prefer letting the global handler do this) */
  internal: (message = 'Internal Server Error') => new AppError(500, message),
};
