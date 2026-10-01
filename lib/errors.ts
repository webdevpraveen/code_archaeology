/**
 * Application error classes
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'INTERNAL_ERROR',
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: Record<string, any>) {
    super(message, 'UNAUTHORIZED', 401, details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: Record<string, any>) {
    super(message, 'FORBIDDEN', 403, details);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'ConflictError';
  }
}

export class GitHubAPIError extends AppError {
  constructor(
    message: string,
    public gitHubStatus?: number,
    details?: Record<string, any>
  ) {
    const statusCode =
      gitHubStatus === 404 ? 404 : gitHubStatus === 401 ? 401 : 502;
    super(message, 'GITHUB_API_ERROR', statusCode, details);
    this.name = 'GitHubAPIError';
  }
}

export class GroqAPIError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'GROQ_API_ERROR', 502, details);
    this.name = 'GroqAPIError';
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string = 'Rate limit exceeded',
    public resetTime?: Date,
    details?: Record<string, any>
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, details);
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Operation timeout', details?: Record<string, any>) {
    super(message, 'TIMEOUT', 408, details);
    this.name = 'TimeoutError';
  }
}

/**
 * Check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown, defaultCode: string = 'INTERNAL_ERROR'): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, defaultCode);
  }

  return new AppError(String(error), defaultCode);
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown) {
  const appError = toAppError(error);

  return {
    success: false,
    error: appError.message,
    code: appError.code,
    ...(process.env.NODE_ENV === 'development' && {
      details: appError.details,
      stack: appError.stack,
    }),
  };
}
