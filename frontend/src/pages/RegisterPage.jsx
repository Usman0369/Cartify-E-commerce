import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './auth.css'

function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/account" replace />

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (form.name.trim().length < 2) {
      setError('Enter your name.')
      return
    }
    if (form.password.length < 8) {
      setError('Use at least 8 characters for your password.')
      return
    }
    if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      setError('Include at least one letter and one number in your password.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Those passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const data = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      navigate('/verify-email', {
        replace: true,
        state: {
          email: data?.email || form.email.trim(),
          challengeId: data?.challengeId,
          cooldownSeconds: data?.cooldownSeconds,
        },
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Join Cartify"
      title="Create your account"
      description="We will email you a 6-digit code to verify your address before your first sign-in."
      footer={
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field">
          <span>Full name</span>
          <input
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={handleChange('name')}
            required
          />
        </label>

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
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange('password')}
            required
          />
          <small>At least 8 characters with a letter and a number.</small>
        </label>

        <label className="auth-field">
          <span>Confirm password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange('confirmPassword')}
            required
          />
        </label>

        <button className="btn btn--primary auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}

export default RegisterPage
