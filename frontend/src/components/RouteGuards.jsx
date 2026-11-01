import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function AuthLoading() {
  return (
    <div className="page-loading" role="status">
      <span className="page-loading__spinner" aria-hidden="true" />
      <p>Loading your account...</p>
    </div>
  )
}

export function RequireAuth() {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <AuthLoading />

  if (!user) {
    const redirect = `${location.pathname}${location.search}`
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />
  }

  return <Outlet />
}

export function RequireAdmin() {
  const { user, initializing, isAdmin } = useAuth()
  const location = useLocation()

  if (initializing) return <AuthLoading />

  if (!user) {
    const redirect = `${location.pathname}${location.search}`
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />
  }

  if (!isAdmin) return <Navigate to="/account" replace />

  return <Outlet />
}
