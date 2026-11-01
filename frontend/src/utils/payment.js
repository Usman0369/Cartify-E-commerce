export function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '')
}

export function getCardBrand(value) {
  const digits = digitsOnly(value)

  if (/^4/.test(digits)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'American Express'
  if (/^6(?:011|5)/.test(digits)) return 'Discover'
  return 'Card'
}

export function passesLuhn(value) {
  const digits = digitsOnly(value)

  if (digits.length < 13 || digits.length > 19) return false

  let sum = 0
  let double = false

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index])

    if (double) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    double = !double
  }

  return sum % 10 === 0
}

export function isValidCardNumber(value) {
  return passesLuhn(value)
}

export function getCardLast4(value) {
  return digitsOnly(value).slice(-4)
}

export function isValidExpiry(value, now = new Date()) {
  const match = /^(\d{2})\s*\/\s*(\d{2}|\d{4})$/.exec(
    String(value ?? '').trim(),
  )

  if (!match) return false

  const month = Number(match[1])
  const rawYear = match[2]
  const year = rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear)

  if (month < 1 || month > 12) return false

  const expiryMonth = new Date(year, month - 1, 1)
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  return expiryMonth >= currentMonth
}

export function isValidCvc(value) {
  return /^\d{3,4}$/.test(String(value ?? '').trim())
}

export function isValidPhone(value) {
  const digits = digitsOnly(value)
  return digits.length >= 7 && digits.length <= 15
}
