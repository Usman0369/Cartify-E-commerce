import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(200)
const password = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(128, 'Password is too long.')
  .regex(/[A-Za-z]/, 'Include at least one letter.')
  .regex(/\d/, 'Include at least one number.')
const code = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code from your email.')

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80),
  email,
  password,
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.').max(128),
})

export const verifyEmailSchema = z.object({
  email,
  code,
  challengeId: z.string().trim().max(200).optional(),
})

export const resendOtpSchema = z.object({
  email,
  purpose: z.enum([
    'email_verify',
    'login_2fa',
    'password_reset',
    '2fa_enable',
    '2fa_disable',
  ]),
})

export const loginTwoFactorSchema = z.object({
  email,
  code,
  challengeId: z.string().trim().max(200).optional(),
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z.object({
  email,
  code,
  challengeId: z.string().trim().max(200).optional(),
  password,
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: password,
})

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80),
})

export const enableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Enter your password.'),
})

export const confirmTwoFactorSchema = z.object({
  code,
  challengeId: z.string().trim().max(200).optional(),
})

export const disableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Enter your password.'),
  code,
  challengeId: z.string().trim().max(200).optional(),
})

export const mergeCartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1).max(120),
        quantity: z.coerce.number().int().min(1).max(25),
      }),
    )
    .max(50)
    .default([]),
})
