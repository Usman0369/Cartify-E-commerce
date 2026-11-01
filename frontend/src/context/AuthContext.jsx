import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  api,
  apiEnabled,
  refreshSession,
  setAccessToken,
} from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(apiEnabled)

  useEffect(() => {
    if (!apiEnabled) return undefined

    let cancelled = false
    refreshSession()
      .then((data) => {
        if (!cancelled) setUser(data?.user ?? null)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setInitializing(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await api.post('/auth/login', credentials, { retry: false })
    if (data?.accessToken) {
      setAccessToken(data.accessToken)
      setUser(data.user)
    }
    return data
  }, [])

  const loginTwoFactor = useCallback(async (payload) => {
    const data = await api.post('/auth/login/2fa', payload, { retry: false })
    if (data?.accessToken) {
      setAccessToken(data.accessToken)
      setUser(data.user)
    }
    return data
  }, [])

  const register = useCallback(
    (payload) => api.post('/auth/register', payload, { retry: false }),
    [],
  )

  const verifyEmail = useCallback(
    (payload) => api.post('/auth/verify-email', payload, { retry: false }),
    [],
  )

  const resendOtp = useCallback(
    (payload) => api.post('/auth/resend-otp', payload, { retry: false }),
    [],
  )

  const requestTwoFactorEnable = useCallback(
    (password) => api.post('/auth/2fa/enable/request', { password }),
    [],
  )

  const confirmTwoFactorEnable = useCallback(async (payload) => {
    const data = await api.post('/auth/2fa/enable/confirm', payload)
    setUser(data.user)
    return data
  }, [])

  const requestTwoFactorDisable = useCallback(
    (password) => api.post('/auth/2fa/disable/request', { password }),
    [],
  )

  const confirmTwoFactorDisable = useCallback(async (payload) => {
    const data = await api.post('/auth/2fa/disable/confirm', payload)
    setAccessToken(data.accessToken)
    setUser(data.user)
    return data
  }, [])

  const forgotPassword = useCallback(
    (email) => api.post('/auth/forgot-password', { email }, { retry: false }),
    [],
  )

  const resetPassword = useCallback(
    (payload) =>
      api.post('/auth/reset-password', payload, { retry: false }),
    [],
  )

  const updateProfile = useCallback(async (payload) => {
    const data = await api.patch('/auth/profile', payload)
    setUser(data.user)
    return data.user
  }, [])

  const changePassword = useCallback(async (payload) => {
    const data = await api.post('/auth/change-password', payload)
    setAccessToken(data.accessToken)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const data = await api.get('/auth/me')
    setUser(data.user)
    return data
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      initializing,
      apiEnabled,
      login,
      loginTwoFactor,
      register,
      verifyEmail,
      resendOtp,
      requestTwoFactorEnable,
      confirmTwoFactorEnable,
      requestTwoFactorDisable,
      confirmTwoFactorDisable,
      forgotPassword,
      resetPassword,
      updateProfile,
      changePassword,
      logout,
      refreshUser,
    }),
    [
      user,
      initializing,
      login,
      loginTwoFactor,
      register,
      verifyEmail,
      resendOtp,
      requestTwoFactorEnable,
      confirmTwoFactorEnable,
      requestTwoFactorDisable,
      confirmTwoFactorDisable,
      forgotPassword,
      resetPassword,
      updateProfile,
      changePassword,
      logout,
      refreshUser,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
