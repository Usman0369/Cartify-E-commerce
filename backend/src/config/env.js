import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { z } from 'zod'

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)

dotenv.config({ path: path.join(backendRoot, '.env') })

const booleanString = z
  .string()
  .optional()
  .transform((value) => String(value ?? 'false').toLowerCase() === 'true')

const numberString = (fallback) =>
  z.coerce.number().int().positive().default(fallback)

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: numberString(5000),
  CLIENT_ORIGINS: z.string().default('http://localhost:5173'),
  MONGODB_URI: z
    .string()
    .default('mongodb://127.0.0.1:27017/cartify'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16)
    .default('cartify-development-access-secret-change-me'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_DAYS: numberString(7),
  COOKIE_SECURE: booleanString,
  SMTP_HOST: z.string().default('smtp-relay.brevo.com'),
  SMTP_PORT: numberString(587),
  SMTP_SECURE: booleanString,
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  BREVO_API_KEY: z.string().default(''),
  BREVO_SENDER_EMAIL: z.string().default('no-reply@cartify.local'),
  BREVO_SENDER_NAME: z.string().default('Cartify'),
  OTP_TTL_MINUTES: numberString(5),
  OTP_RESEND_SECONDS: numberString(60),
  OTP_MAX_ATTEMPTS: numberString(5),
  OTP_MAX_PER_HOUR: numberString(5),
  ADMIN_NAME: z.string().default('Cartify Admin'),
  ADMIN_EMAIL: z.string().email().default('admin@cartify.local'),
  ADMIN_PASSWORD: z.string().min(8).default('ChangeThisAdminPassword123!'),
  RATE_LIMIT_DISABLED: booleanString,
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ')
  throw new Error(`Invalid environment configuration: ${details}`)
}

const data = parsed.data
const isProduction = data.NODE_ENV === 'production'

if (
  isProduction &&
  (data.JWT_ACCESS_SECRET.includes('development') ||
    data.JWT_ACCESS_SECRET.length < 32)
) {
  throw new Error(
    'JWT_ACCESS_SECRET must be a unique secret of at least 32 characters in production.',
  )
}

export const env = {
  ...data,
  isProduction,
  isTest: data.NODE_ENV === 'test',
  clientOrigins: data.CLIENT_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  refreshCookieName: 'cartify_refresh',
}
