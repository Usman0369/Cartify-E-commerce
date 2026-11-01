import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AuthShell from '../components/AuthShell.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getSafeRedirect } from '../utils/redirect.js'
import './auth.css'

function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const redirect = getSafeRedirect(
    location.state?.redirect || searchParams.get('redirect'),
  )
  const notice = location.state?.message

  if (user) return <Navigate to={redirect} replace />

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const data = await login(form)
      if (data?.twoFactorRequired) {
        navigate('/login/2fa', {
          replace: true,
          state: {
            email: data?.email || form.email,
            challengeId: data?.challengeId,
            redirect,
          },
        })
        return
      }
      navigate(redirect, { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Cartify"
      description="Track orders, save addresses, manage your wishlist, and keep your account secure."
      footer={
        <p>
          New to Cartify? <Link to="/register">Create an account</Link>
        </p>
      }
    >
      {notice && <p className="auth-notice">{notice}</p>}
      {error && (
        <div className="auth-error" role="alert">
          <p>{error}</p>
          {error.toLowerCase().includes('verify your email') && (
            <Link
              to={`/verify-email?email=${encodeURIComponent(form.email)}`}
            >
              Verify your email
            </Link>
          )}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field">
          <span>Email address</span>
          <input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange('email')}
            required
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange('password')}
            required
          />
        </label>

        <div className="auth-form__row">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <button className="btn btn--primary auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="auth-meta">
        Protected by email verification and optional two-factor authentication.
      </p>
    </AuthShell>
  )
}

export default LoginPage
