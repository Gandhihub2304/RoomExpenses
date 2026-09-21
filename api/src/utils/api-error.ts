export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Authentication required") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "You don't have permission to do this") {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(message = "Conflict", details?: unknown) {
    return new ApiError(409, "CONFLICT", message, details);
  }

  static tooManyRequests(message = "Too many requests") {
    return new ApiError(429, "TOO_MANY_REQUESTS", message);
  }

  static internal(message = "Something went wrong") {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}
