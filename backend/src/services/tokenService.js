import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { RefreshSession } from '../models/RefreshSession.js'
import { ApiError, unauthorized } from '../utils/ApiError.js'
import { generateToken, hashToken } from '../utils/crypto.js'

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      type: 'access',
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  )
}

export function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET)
    if (payload.type !== 'access') throw new Error('Wrong token type')
    return payload
  } catch {
    throw unauthorized('Your session has expired. Please sign in again.', 'TOKEN_INVALID')
  }
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  }
}

export async function createRefreshSession(user, req) {
  const token = generateToken(48)
  const expiresAt = new Date(
    Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  )

  await RefreshSession.create({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt,
    ip: req.ip ?? '',
    userAgent: String(req.get('user-agent') ?? '').slice(0, 400),
  })

  return { token, expiresAt }
}

export async function rotateRefreshSession(rawToken, req) {
  if (!rawToken) {
    throw unauthorized('Refresh session not found.', 'REFRESH_MISSING')
  }

  const tokenHash = hashToken(rawToken)
  const session = await RefreshSession.findOne({ tokenHash })

  if (!session) {
    throw unauthorized('Refresh session is invalid.', 'REFRESH_INVALID')
  }

  if (session.revokedAt) {
    await RefreshSession.updateMany(
      { user: session.user, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    )
    throw unauthorized(
      'This session has already been used. Please sign in again.',
      'REFRESH_REUSED',
    )
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    throw unauthorized('Refresh session has expired.', 'REFRESH_EXPIRED')
  }

  const nextToken = generateToken(48)
  const nextHash = hashToken(nextToken)
  const expiresAt = new Date(
    Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  )

  session.revokedAt = new Date()
  session.replacedByTokenHash = nextHash
  await session.save()

  await RefreshSession.create({
    user: session.user,
    tokenHash: nextHash,
    expiresAt,
    ip: req.ip ?? '',
    userAgent: String(req.get('user-agent') ?? '').slice(0, 400),
  })

  return { user: session.user, token: nextToken, expiresAt }
}

export async function revokeRefreshSession(rawToken) {
  if (!rawToken) return
  await RefreshSession.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  )
}

export async function revokeAllUserSessions(userId) {
  await RefreshSession.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  )
}

export async function issueAuthTokens(user, req, res) {
  const accessToken = signAccessToken(user)
  const refresh = await createRefreshSession(user, req)

  res.cookie(env.refreshCookieName, refresh.token, refreshCookieOptions())

  return {
    accessToken,
    expiresAt: refresh.expiresAt,
  }
}

export function clearRefreshCookie(res) {
  res.clearCookie(env.refreshCookieName, {
    ...refreshCookieOptions(),
    maxAge: undefined,
  })
}

export function assertAccessToken(token) {
  if (!token) throw new ApiError(401, 'Authentication required.', { code: 'UNAUTHORIZED' })
  return verifyAccessToken(token)
}
