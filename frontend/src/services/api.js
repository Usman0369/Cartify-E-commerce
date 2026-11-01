const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export const apiEnabled =
  import.meta.env.MODE !== 'test' && import.meta.env.VITE_API_ENABLED !== 'false'

let accessToken = null
let refreshPromise = null

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'REQUEST_FAILED', errors } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.errors = errors
  }
}

export function setAccessToken(token) {
  accessToken = token || null
}

export function getAccessToken() {
  return accessToken
}

async function parseResponse(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function rawRequest(path, options = {}) {
  const headers = new Headers(options.headers)
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  } else if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method || 'GET',
      headers,
      credentials: 'include',
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError(
      'The Cartify API could not be reached. Make sure the backend is running.',
      { code: 'NETWORK_ERROR' },
    )
  }

  const payload = await parseResponse(response)

  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message || 'Something went wrong.', {
      status: response.status,
      code: payload?.code,
      errors: payload?.errors,
    })
  }

  return payload?.data ?? null
}

export async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = rawRequest('/auth/refresh', {
      method: 'POST',
      token: '',
    })
      .then((data) => {
        setAccessToken(data?.accessToken)
        return data
      })
      .catch((error) => {
        setAccessToken(null)
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export async function apiRequest(path, options = {}) {
  const isAuthRequest = path.startsWith('/auth/')
  const canRefresh = options.retry !== false && !isAuthRequest

  try {
    return await rawRequest(path, options)
  } catch (error) {
    if (error.status === 401 && canRefresh && accessToken) {
      try {
        await refreshSession()
      } catch {
        setAccessToken(null)
        throw error
      }
      return rawRequest(path, options)
    }
    throw error
  }
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) =>
    apiRequest(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) =>
    apiRequest(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) =>
    apiRequest(path, { ...options, method: 'DELETE' }),
}
