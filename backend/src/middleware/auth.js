import { User } from '../models/User.js'
import { unauthorized } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { verifyAccessToken } from '../services/tokenService.js'

function bearerToken(req) {
  const header = String(req.get('authorization') ?? '')
  if (!header.toLowerCase().startsWith('bearer ')) return null
  return header.slice(7).trim()
}

async function loadUserFromToken(token) {
  const payload = verifyAccessToken(token)
  const user = await User.findById(payload.sub)

  if (!user || !user.active) {
    throw unauthorized('This account is not available.', 'ACCOUNT_UNAVAILABLE')
  }

  return user
}

export const protect = asyncHandler(async (req, _res, next) => {
  const token = bearerToken(req)
  if (!token) throw unauthorized('Authentication required.')

  req.user = await loadUserFromToken(token)
  next()
})

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = bearerToken(req)
  if (!token) {
    req.user = null
    return next()
  }

  try {
    req.user = await loadUserFromToken(token)
  } catch {
    req.user = null
  }

  return next()
})
