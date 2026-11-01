import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { OTP_PURPOSES } from '../config/constants.js'
import { User } from '../models/User.js'
import {
  ApiError,
  badRequest,
  conflict,
  forbidden,
  unauthorized,
} from '../utils/ApiError.js'
import { sendCreated, sendSuccess } from '../utils/response.js'
import { publicUser, serializeCart } from '../utils/serializers.js'
import { logActivity } from '../services/activityService.js'
import { issueOtp, verifyOtp } from '../services/otpService.js'
import {
  clearRefreshCookie,
  issueAuthTokens,
  refreshCookieOptions,
  revokeAllUserSessions,
  revokeRefreshSession,
  rotateRefreshSession,
  signAccessToken,
} from '../services/tokenService.js'
import { getCart, mergeGuestCart } from '../services/cartService.js'

function authResponse(user, tokens) {
  return {
    user: publicUser(user),
    accessToken: tokens.accessToken,
    expiresAt: tokens.expiresAt,
  }
}

function otpOptions(user, purpose, extra = {}) {
  return {
    user,
    email: user.email,
    name: user.name,
    purpose,
    metadata: extra,
  }
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body
    const existing = await User.findOne({ email })

    if (existing) {
      throw conflict(
        'An account with this email already exists. Sign in or reset your password.',
        'EMAIL_IN_USE',
      )
    }

    const passwordHash = await User.hashPassword(password)
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'customer',
      emailVerified: false,
    })

    let otp
    try {
      otp = await issueOtp(
        otpOptions(user, OTP_PURPOSES.EMAIL_VERIFY, { userId: String(user._id) }),
      )
    } catch (error) {
      await User.deleteOne({ _id: user._id })
      throw error
    }

    await logActivity({
      type: 'auth.register',
      message: `New account registered for ${email}.`,
      actor: user._id,
    })

    return sendCreated(
      res,
      {
        email: user.email,
        challengeId: otp.challengeId,
        expiresAt: otp.expiresAt,
        cooldownSeconds: otp.cooldownSeconds,
      },
      'We sent a verification code to your email.',
    )
  } catch (error) {
    return next(error)
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { email, code, challengeId } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      throw badRequest('That code is invalid or has expired.', 'OTP_INVALID')
    }

    if (user.emailVerified) {
      return sendSuccess(res, { email: user.email, alreadyVerified: true })
    }

    await verifyOtp({
      email,
      purpose: OTP_PURPOSES.EMAIL_VERIFY,
      code,
      challengeId,
    })

    user.emailVerified = true
    await user.save()

    await logActivity({
      type: 'auth.email_verified',
      message: `${user.email} verified their email.`,
      actor: user._id,
    })

    return sendSuccess(
      res,
      { email: user.email, verified: true },
      200,
      'Your email is verified. You can sign in now.',
    )
  } catch (error) {
    return next(error)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email }).select(
      '+passwordHash +failedLoginAttempts +lockedUntil',
    )

    if (!user) {
      throw unauthorized('Email or password is incorrect.', 'INVALID_CREDENTIALS')
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw tooManyLoginAttempts(user.lockedUntil)
    }

    if (!user.active) {
      throw forbidden('This account has been disabled.', 'ACCOUNT_DISABLED')
    }

    const passwordMatches = await user.comparePassword(password)

    if (!passwordMatches) {
      user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
        user.failedLoginAttempts = 0
      }
      await user.save()
      throw unauthorized('Email or password is incorrect.', 'INVALID_CREDENTIALS')
    }

    user.failedLoginAttempts = 0
    user.lockedUntil = null

    if (!user.emailVerified) {
      await user.save()
      throw new ApiError(
        403,
        'Verify your email before signing in. Request a new verification code.',
        { code: 'EMAIL_NOT_VERIFIED', details: { email: user.email } },
      )
    }

    if (user.twoFactorEnabled) {
      const otp = await issueOtp(
        otpOptions(user, OTP_PURPOSES.LOGIN_2FA, { userId: String(user._id) }),
      )
      await user.save()

      return res.status(202).json({
        success: true,
        twoFactorRequired: true,
        message: 'We sent a sign-in code to your email.',
        data: {
          twoFactorRequired: true,
          email: user.email,
          challengeId: otp.challengeId,
          expiresAt: otp.expiresAt,
          cooldownSeconds: otp.cooldownSeconds,
        },
      })
    }

    user.lastLoginAt = new Date()
    await user.save()
    const tokens = await issueAuthTokens(user, req, res)

    await logActivity({
      type: 'auth.login',
      message: `${user.email} signed in.`,
      actor: user._id,
    })

    return sendSuccess(res, authResponse(user, tokens), 200, 'Signed in.')
  } catch (error) {
    return next(error)
  }
}

export async function loginTwoFactor(req, res, next) {
  try {
    const { email, code, challengeId } = req.body
    const user = await User.findOne({ email })

    if (!user || !user.twoFactorEnabled || !user.active) {
      throw unauthorized('That code is invalid or has expired.', 'OTP_INVALID')
    }

    await verifyOtp({
      email,
      purpose: OTP_PURPOSES.LOGIN_2FA,
      code,
      challengeId,
    })

    user.lastLoginAt = new Date()
    await user.save()
    const tokens = await issueAuthTokens(user, req, res)

    await logActivity({
      type: 'auth.login_2fa',
      message: `${user.email} signed in with two-factor authentication.`,
      actor: user._id,
    })

    return sendSuccess(res, authResponse(user, tokens), 200, 'Signed in.')
  } catch (error) {
    return next(error)
  }
}

export async function refresh(req, res, next) {
  try {
    const rawToken = req.cookies?.[env.refreshCookieName]
    const rotated = await rotateRefreshSession(rawToken, req)
    const user = await User.findById(rotated.user)

    if (!user || !user.active) {
      clearRefreshCookie(res)
      throw unauthorized('This account is not available.', 'ACCOUNT_UNAVAILABLE')
    }

    res.cookie(env.refreshCookieName, rotated.token, refreshCookieOptions())
    const accessToken = signAccessToken(user)

    return sendSuccess(res, {
      user: publicUser(user),
      accessToken,
      expiresAt: rotated.expiresAt,
    })
  } catch (error) {
    clearRefreshCookie(res)
    return next(error)
  }
}

export async function logout(req, res, next) {
  try {
    await revokeRefreshSession(req.cookies?.[env.refreshCookieName])
    clearRefreshCookie(res)
    return sendSuccess(res, null, 200, 'Signed out.')
  } catch (error) {
    return next(error)
  }
}

export async function logoutAll(req, res, next) {
  try {
    await revokeAllUserSessions(req.user._id)
    clearRefreshCookie(res)
    return sendSuccess(res, null, 200, 'Signed out of all devices.')
  } catch (error) {
    return next(error)
  }
}

export async function me(req, res, next) {
  try {
    const cart = await getCart(req.user._id)
    return sendSuccess(res, {
      user: publicUser(req.user),
      cart: serializeCart(cart),
    })
  } catch (error) {
    return next(error)
  }
}

export async function updateProfile(req, res, next) {
  try {
    req.user.name = req.body.name
    await req.user.save()
    return sendSuccess(res, { user: publicUser(req.user) }, 200, 'Profile updated.')
  } catch (error) {
    return next(error)
  }
}

export async function resendOtp(req, res, next) {
  try {
    const { email, purpose } = req.body
    const user = await User.findOne({ email })

    let otp = null
    if (user) {
      if (purpose === OTP_PURPOSES.EMAIL_VERIFY && !user.emailVerified) {
        otp = await issueOtp(otpOptions(user, purpose, { userId: String(user._id) }))
      } else if (purpose === OTP_PURPOSES.PASSWORD_RESET) {
        otp = await issueOtp(otpOptions(user, purpose, { userId: String(user._id) }))
      } else if (purpose === OTP_PURPOSES.LOGIN_2FA && user.twoFactorEnabled) {
        otp = await issueOtp(otpOptions(user, purpose, { userId: String(user._id) }))
      }
    }

    return sendSuccess(
      res,
      otp
        ? {
            challengeId: otp.challengeId,
            expiresAt: otp.expiresAt,
            cooldownSeconds: otp.cooldownSeconds,
          }
        : null,
      200,
      'If that email has an account, a new code has been sent.',
    )
  } catch (error) {
    return next(error)
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })

    if (user && user.active) {
      try {
        const otp = await issueOtp(
          otpOptions(user, OTP_PURPOSES.PASSWORD_RESET, {
            userId: String(user._id),
          }),
        )
        return sendSuccess(
          res,
          {
            challengeId: otp.challengeId,
            expiresAt: otp.expiresAt,
            cooldownSeconds: otp.cooldownSeconds,
          },
          200,
          'If that email has an account, a reset code has been sent.',
        )
      } catch (error) {
        console.error('Password reset email failed:', error.message)
      }
    }

    return sendSuccess(
      res,
      null,
      200,
      'If that email has an account, a reset code has been sent.',
    )
  } catch (error) {
    return next(error)
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { email, code, challengeId, password } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      throw badRequest('That code is invalid or has expired.', 'OTP_INVALID')
    }

    await verifyOtp({
      email,
      purpose: OTP_PURPOSES.PASSWORD_RESET,
      code,
      challengeId,
    })

    user.passwordHash = await User.hashPassword(password)
    user.emailVerified = true
    user.failedLoginAttempts = 0
    user.lockedUntil = null
    await user.save()

    await revokeAllUserSessions(user._id)
    clearRefreshCookie(res)

    await logActivity({
      type: 'auth.password_reset',
      message: `${user.email} reset their password.`,
      actor: user._id,
    })

    return sendSuccess(
      res,
      { email: user.email },
      200,
      'Your password has been reset. Sign in with your new password.',
    )
  } catch (error) {
    return next(error)
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id).select('+passwordHash')

    if (!(await user.comparePassword(currentPassword))) {
      throw badRequest('Your current password is incorrect.', 'PASSWORD_INCORRECT')
    }

    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      throw badRequest('Choose a password you have not used just now.', 'PASSWORD_REUSED')
    }

    user.passwordHash = await User.hashPassword(newPassword)
    await user.save()
    await revokeAllUserSessions(user._id)
    const tokens = await issueAuthTokens(user, req, res)

    return sendSuccess(
      res,
      authResponse(user, tokens),
      200,
      'Password changed. Other devices have been signed out.',
    )
  } catch (error) {
    return next(error)
  }
}

export async function requestEnableTwoFactor(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('+passwordHash')

    if (!(await user.comparePassword(req.body.password))) {
      throw badRequest('Your password is incorrect.', 'PASSWORD_INCORRECT')
    }

    if (user.twoFactorEnabled) {
      throw conflict(
        'Two-factor authentication is already enabled.',
        'TWO_FACTOR_ALREADY_ENABLED',
      )
    }

    const otp = await issueOtp(
      otpOptions(user, OTP_PURPOSES.TWO_FACTOR_ENABLE, {
        userId: String(user._id),
      }),
    )

    return sendSuccess(res, {
      challengeId: otp.challengeId,
      expiresAt: otp.expiresAt,
      cooldownSeconds: otp.cooldownSeconds,
    })
  } catch (error) {
    return next(error)
  }
}

export async function confirmEnableTwoFactor(req, res, next) {
  try {
    const { code, challengeId } = req.body

    await verifyOtp({
      email: req.user.email,
      purpose: OTP_PURPOSES.TWO_FACTOR_ENABLE,
      code,
      challengeId,
    })

    req.user.twoFactorEnabled = true
    await req.user.save()

    await logActivity({
      type: 'auth.2fa_enabled',
      message: `${req.user.email} enabled two-factor authentication.`,
      actor: req.user._id,
    })

    return sendSuccess(
      res,
      { user: publicUser(req.user) },
      200,
      'Two-factor authentication is enabled.',
    )
  } catch (error) {
    return next(error)
  }
}

export async function requestDisableTwoFactor(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('+passwordHash')

    if (!(await user.comparePassword(req.body.password))) {
      throw badRequest('Your password is incorrect.', 'PASSWORD_INCORRECT')
    }

    if (!user.twoFactorEnabled) {
      throw conflict(
        'Two-factor authentication is not enabled.',
        'TWO_FACTOR_NOT_ENABLED',
      )
    }

    const otp = await issueOtp(
      otpOptions(user, OTP_PURPOSES.TWO_FACTOR_DISABLE, {
        userId: String(user._id),
      }),
    )

    return sendSuccess(res, {
      challengeId: otp.challengeId,
      expiresAt: otp.expiresAt,
      cooldownSeconds: otp.cooldownSeconds,
    })
  } catch (error) {
    return next(error)
  }
}

export async function confirmDisableTwoFactor(req, res, next) {
  try {
    const { code, challengeId } = req.body

    await verifyOtp({
      email: req.user.email,
      purpose: OTP_PURPOSES.TWO_FACTOR_DISABLE,
      code,
      challengeId,
    })

    req.user.twoFactorEnabled = false
    await req.user.save()
    await revokeAllUserSessions(req.user._id)
    const tokens = await issueAuthTokens(req.user, req, res)

    await logActivity({
      type: 'auth.2fa_disabled',
      message: `${req.user.email} disabled two-factor authentication.`,
      actor: req.user._id,
    })

    return sendSuccess(
      res,
      { ...authResponse(req.user, tokens), twoFactorEnabled: false },
      200,
      'Two-factor authentication is disabled.',
    )
  } catch (error) {
    return next(error)
  }
}

export async function mergeCart(req, res, next) {
  try {
    const cart = await mergeGuestCart(req.user._id, req.body.items)
    return sendSuccess(res, { cart: serializeCart(cart) })
  } catch (error) {
    return next(error)
  }
}

export async function resendTwoFactorOtp(req, res, next) {
  try {
    req.user = await User.findById(req.user._id)
    const purpose = req.body.purpose
    if (![OTP_PURPOSES.TWO_FACTOR_ENABLE, OTP_PURPOSES.TWO_FACTOR_DISABLE].includes(purpose)) {
      throw badRequest('Choose a valid verification purpose.', 'OTP_PURPOSE_INVALID')
    }

    const otp = await issueOtp(otpOptions(req.user, purpose))
    return sendSuccess(res, {
      challengeId: otp.challengeId,
      expiresAt: otp.expiresAt,
      cooldownSeconds: otp.cooldownSeconds,
    })
  } catch (error) {
    return next(error)
  }
}

function tooManyLoginAttempts(lockedUntil) {
  return new ApiError(
    429,
    'Too many sign-in attempts. Try again in a few minutes.',
    { code: 'LOGIN_LOCKED', details: { retryAt: lockedUntil } },
  )
}
