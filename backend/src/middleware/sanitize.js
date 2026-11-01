function sanitizeValue(value, depth = 0) {
  if (depth > 12) return value

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry, depth + 1))
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const clean = {}
    for (const [key, entry] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.')) continue
      clean[key] = sanitizeValue(entry, depth + 1)
    }
    return clean
  }

  if (typeof value === 'string') {
    return value.replaceAll('\u0000', '')
  }

  return value
}

export function sanitizeRequest(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body)
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params)
  }

  next()
}
