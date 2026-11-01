export class ApiError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = options.code ?? 'REQUEST_FAILED'
    this.details = options.details
    this.isOperational = true
  }
}

export function badRequest(message, code = 'BAD_REQUEST', details) {
  return new ApiError(400, message, { code, details })
}

export function unauthorized(message = 'Authentication required.', code = 'UNAUTHORIZED') {
  return new ApiError(401, message, { code })
}

export function forbidden(message = 'You do not have permission to do that.', code = 'FORBIDDEN') {
  return new ApiError(403, message, { code })
}

export function notFound(message = 'Resource not found.', code = 'NOT_FOUND') {
  return new ApiError(404, message, { code })
}

export function conflict(message, code = 'CONFLICT') {
  return new ApiError(409, message, { code })
}

export function tooManyRequests(message, code = 'RATE_LIMITED', details) {
  return new ApiError(429, message, { code, details })
}
