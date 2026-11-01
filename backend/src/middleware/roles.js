import { forbidden, unauthorized } from '../utils/ApiError.js'

export function authorize(...roles) {
  return function roleGuard(req, _res, next) {
    if (!req.user) return next(unauthorized('Authentication required.'))
    if (!roles.includes(req.user.role)) {
      return next(forbidden('You do not have access to this resource.'))
    }
    return next()
  }
}
