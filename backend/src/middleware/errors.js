import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

export function notFoundHandler(req, _res, next) {
  next(
    new ApiError(404, `Route ${req.method} ${req.originalUrl} was not found.`, {
      code: 'ROUTE_NOT_FOUND',
    }),
  )
}

export function errorHandler(error, req, res, _next) {
  let normalized = error

  if (error instanceof mongoose.Error.ValidationError) {
    normalized = new ApiError(400, 'Validation failed.', {
      code: 'VALIDATION_ERROR',
      details: Object.values(error.errors).map((entry) => ({
        field: entry.path,
        message: entry.message,
      })),
    })
  } else if (error instanceof mongoose.Error.CastError) {
    normalized = new ApiError(400, 'Invalid identifier.', {
      code: 'INVALID_ID',
    })
  } else if (error?.code === 11000) {
    normalized = new ApiError(409, 'That record already exists.', {
      code: 'DUPLICATE_RECORD',
      details: Object.keys(error.keyValue ?? {}),
    })
  } else if (!(error instanceof ApiError)) {
    normalized = new ApiError(500, 'Something went wrong on our side.', {
      code: 'INTERNAL_ERROR',
    })
  }

  if (normalized.statusCode >= 500) {
    console.error(`[${req.id ?? 'no-request-id'}]`, error)
  }

  const payload = {
    success: false,
    message: normalized.message,
    code: normalized.code,
    ...(normalized.details ? { errors: normalized.details } : {}),
    ...(!env.isProduction && normalized.statusCode >= 500 && error?.stack
      ? { stack: error.stack }
      : {}),
  }

  res.status(normalized.statusCode).json(payload)
}
