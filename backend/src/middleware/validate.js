import { badRequest } from '../utils/ApiError.js'

export function validate(schema, source = 'body') {
  return function validateRequest(req, _res, next) {
    const parsed = schema.safeParse(req[source] ?? {})

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      return next(
        badRequest('Please check the submitted information.', 'VALIDATION_ERROR', details),
      )
    }

    req[source] = parsed.data
    return next()
  }
}
