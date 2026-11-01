import crypto from 'node:crypto'

export function generateOtp() {
  return String(crypto.randomInt(100000, 1000000))
}

export function generateToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString('hex')
}

export function generatePublicId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

export function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left))
  const rightBuffer = Buffer.from(String(right))
  if (leftBuffer.length !== rightBuffer.length) return false
  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}
