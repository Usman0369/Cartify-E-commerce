import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { Otp } from '../models/Otp.js'
import {
  ApiError,
  badRequest,
  tooManyRequests,
} from '../utils/ApiError.js'
import { generateOtp, generateToken } from '../utils/crypto.js'
import { getMailer } from './emailService.js'

const OTP_SALT_ROUNDS = 10

function otpTtlMs() {
  return env.OTP_TTL_MINUTES * 60 * 1000
}

function cooldownMs() {
  return env.OTP_RESEND_SECONDS * 1000
}

export async function issueOtp({
  user = null,
  email,
  name,
  purpose,
  mailer = getMailer(),
  metadata = {},
}) {
  const normalizedEmail = String(email).trim().toLowerCase()
  const now = new Date()

  const latest = await Otp.findOne({
    email: normalizedEmail,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: now },
  }).sort({ createdAt: -1 })

  if (latest && latest.resendAvailableAt.getTime() > now.getTime()) {
    const retryAfter = Math.ceil(
      (latest.resendAvailableAt.getTime() - now.getTime()) / 1000,
    )
    throw tooManyRequests(
      `Please wait ${retryAfter} seconds before requesting another code.`,
      'OTP_COOLDOWN',
      { retryAfter },
    )
  }

  const sentLastHour = await Otp.countDocuments({
    email: normalizedEmail,
    purpose,
    createdAt: { $gte: new Date(now.getTime() - 60 * 60 * 1000) },
  })

  if (sentLastHour >= env.OTP_MAX_PER_HOUR) {
    throw tooManyRequests(
      'Too many verification codes requested. Please try again later.',
      'OTP_HOURLY_LIMIT',
    )
  }

  await Otp.updateMany(
    {
      email: normalizedEmail,
      purpose,
      consumedAt: null,
    },
    { $set: { consumedAt: now } },
  )

  const code = generateOtp()
  const codeHash = await bcrypt.hash(code, OTP_SALT_ROUNDS)
  const challengeId = generateToken(24)
  const expiresAt = new Date(now.getTime() + otpTtlMs())

  const record = await Otp.create({
    user: user?._id ?? null,
    email: normalizedEmail,
    purpose,
    codeHash,
    challengeId,
    expiresAt,
    resendAvailableAt: new Date(now.getTime() + cooldownMs()),
    maxAttempts: env.OTP_MAX_ATTEMPTS,
    metadata,
  })

  try {
    await mailer.sendOtpEmail({
      to: normalizedEmail,
      name: name ?? user?.name,
      code,
      purpose,
      expiresMinutes: env.OTP_TTL_MINUTES,
    })
  } catch (error) {
    record.consumedAt = new Date()
    await record.save()
    throw error
  }

  return {
    challengeId,
    expiresAt,
    cooldownSeconds: env.OTP_RESEND_SECONDS,
  }
}

export async function verifyOtp({
  email,
  purpose,
  code,
  challengeId,
}) {
  const normalizedEmail = String(email).trim().toLowerCase()
  const normalizedCode = String(code ?? '').trim()

  if (!/^\d{6}$/.test(normalizedCode)) {
    throw badRequest('Enter the 6-digit code from your email.', 'OTP_INVALID')
  }

  const query = {
    email: normalizedEmail,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }

  if (challengeId) query.challengeId = challengeId

  const record = await Otp.findOne(query)
    .select('+codeHash')
    .sort({ createdAt: -1 })

  if (!record) {
    throw badRequest(
      'That code is invalid or has expired. Request a new code.',
      'OTP_INVALID',
    )
  }

  if (record.attempts >= record.maxAttempts) {
    record.consumedAt = new Date()
    await record.save()
    throw tooManyRequests(
      'Too many incorrect attempts. Request a new code.',
      'OTP_ATTEMPTS_EXCEEDED',
    )
  }

  const matches = await bcrypt.compare(normalizedCode, record.codeHash)

  if (!matches) {
    record.attempts += 1
    if (record.attempts >= record.maxAttempts) {
      record.consumedAt = new Date()
    }
    await record.save()

    if (record.attempts >= record.maxAttempts) {
      throw tooManyRequests(
        'Too many incorrect attempts. Request a new code.',
        'OTP_ATTEMPTS_EXCEEDED',
      )
    }

    throw badRequest('That code is incorrect. Please try again.', 'OTP_INCORRECT')
  }

  record.consumedAt = new Date()
  await record.save()

  return record
}

export async function invalidateOtps(email, purpose) {
  await Otp.updateMany(
    {
      email: String(email).trim().toLowerCase(),
      purpose,
      consumedAt: null,
    },
    { $set: { consumedAt: new Date() } },
  )
}

export function otpErrorToApiError(error) {
  if (error instanceof ApiError) return error
  return new ApiError(500, 'Unable to process verification code.')
}
