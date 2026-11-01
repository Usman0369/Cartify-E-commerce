import { Router } from 'express'
import {
  changePassword,
  confirmDisableTwoFactor,
  confirmEnableTwoFactor,
  forgotPassword,
  login,
  loginTwoFactor,
  logout,
  logoutAll,
  me,
  mergeCart,
  refresh,
  register,
  requestDisableTwoFactor,
  requestEnableTwoFactor,
  resendOtp,
  resendTwoFactorOtp,
  resetPassword,
  updateProfile,
  verifyEmail,
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import { authLimiter, otpLimiter } from '../middleware/rateLimits.js'
import { validate } from '../middleware/validate.js'
import {
  changePasswordSchema,
  confirmTwoFactorSchema,
  disableTwoFactorSchema,
  enableTwoFactorSchema,
  forgotPasswordSchema,
  loginSchema,
  loginTwoFactorSchema,
  mergeCartSchema,
  registerSchema,
  resendOtpSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from '../validators/auth.js'

export const authRouter = Router()

authRouter.post('/register', authLimiter, validate(registerSchema), register)
authRouter.post('/verify-email', otpLimiter, validate(verifyEmailSchema), verifyEmail)
authRouter.post('/resend-otp', otpLimiter, validate(resendOtpSchema), resendOtp)
authRouter.post('/login', authLimiter, validate(loginSchema), login)
authRouter.post('/login/2fa', authLimiter, validate(loginTwoFactorSchema), loginTwoFactor)
authRouter.post('/refresh', refresh)
authRouter.post('/logout', logout)
authRouter.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), forgotPassword)
authRouter.post('/reset-password', otpLimiter, validate(resetPasswordSchema), resetPassword)

authRouter.get('/me', protect, me)
authRouter.patch('/profile', protect, validate(updateProfileSchema), updateProfile)
authRouter.post('/change-password', protect, validate(changePasswordSchema), changePassword)
authRouter.post('/logout-all', protect, logoutAll)
authRouter.post('/cart/merge', protect, validate(mergeCartSchema), mergeCart)

authRouter.post(
  '/2fa/enable/request',
  protect,
  otpLimiter,
  validate(enableTwoFactorSchema),
  requestEnableTwoFactor,
)
authRouter.post(
  '/2fa/enable/confirm',
  protect,
  validate(confirmTwoFactorSchema),
  confirmEnableTwoFactor,
)
authRouter.post(
  '/2fa/disable/request',
  protect,
  otpLimiter,
  validate(enableTwoFactorSchema),
  requestDisableTwoFactor,
)
authRouter.post(
  '/2fa/disable/confirm',
  protect,
  validate(disableTwoFactorSchema.omit({ password: true })),
  confirmDisableTwoFactor,
)
authRouter.post(
  '/2fa/resend',
  protect,
  otpLimiter,
  validate(
    resendOtpSchema.pick({ purpose: true }).extend({
      purpose: resendOtpSchema.shape.purpose,
    }),
  ),
  resendTwoFactorOtp,
)
