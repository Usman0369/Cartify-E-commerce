export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value) {
  return emailPattern.test(value.trim())
}

export function required(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 8
}
