const DEFAULT_REDIRECT = '/account'
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']

export function getSafeRedirect(value, fallback = DEFAULT_REDIRECT) {
  if (typeof value !== 'string') return fallback

  const redirect = value.trim()
  if (!redirect.startsWith('/') || redirect.startsWith('//')) return fallback
  if (redirect.includes('\\') || /[\u0000-\u001F\u007F]/.test(redirect)) {
    return fallback
  }
  if (AUTH_PATHS.some((path) => redirect === path || redirect.startsWith(`${path}?`))) {
    return fallback
  }

  return redirect
}
