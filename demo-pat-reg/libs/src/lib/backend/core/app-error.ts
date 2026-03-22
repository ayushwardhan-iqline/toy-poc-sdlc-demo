/**
 * AppError — a typed domain error that carries an intended HTTP status code.
 *
 * Usage in use-cases or handlers:
 *   throw new AppError(404, 'Visit not found');
 *
 * The global error handler (error-handler.middleware.ts) converts this into
 * the correct HTTP response automatically. No HTTP imports are required
 * at the call-site.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
    // Maintain proper prototype chain in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
