import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AuthShell from '../components/AuthShell.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './auth.css'

function ResetPasswordPage() {
  const { resetPassword, resendOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(
    location.state?.email || searchParams.get('email') || '',
  )
  const [challengeId, setChallengeId] = useState(
    location.state?.challengeId || '',
  )
  const [form, setForm] = useState({ code: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [seconds, setSeconds] = useState(
    Number(location.state?.cooldownSeconds) || 0,
  )

  useEffect(() => {
    if (seconds <= 0) return undefined
    const timer = window.setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [seconds])

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (form.code.length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    if (form.password.length < 8) {
      setError('Use at least 8 characters for your new password.')
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
      await resetPassword({
        email: email.trim(),
        code: form.code,
        challengeId,
        password: form.password,
      })
      navigate('/login', {
        replace: true,
        state: { message: 'Password reset. Sign in with your new password.' },
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setNotice('')
    try {
      const data = await resendOtp({
        email: email.trim(),
        purpose: 'password_reset',
      })
      if (data?.challengeId) setChallengeId(data.challengeId)
      setSeconds(data?.cooldownSeconds || 60)
      setNotice('A new reset code has been sent.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Choose a new password"
      description={`Enter the code sent to ${email || 'your inbox'} and pick a new password.`}
      footer={
        <p>
          <Link to="/login">Back to sign in</Link>
        </p>
      }
    >
      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}
      {notice && <p className="auth-notice">{notice}</p>}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {!email && (
          <label className="auth-field">
            <span>Email address</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
        )}

        <label className="auth-field">
          <span>Reset code</span>
          <input
            className="auth-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={form.code}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                code: event.target.value.replace(/\D/g, '').slice(0, 6),
              }))
            }
            required
          />
        </label>

        <label className="auth-field">
          <span>New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange('password')}
            required
          />
        </label>

        <label className="auth-field">
          <span>Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange('confirmPassword')}
            required
          />
        </label>

        <button className="btn btn--primary auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'Resetting...' : 'Reset password'}
        </button>
      </form>

      <div className="auth-resend">
        <button
          type="button"
          className="link-button"
          onClick={handleResend}
          disabled={seconds > 0}
        >
          {seconds > 0 ? `Resend code in ${seconds}s` : 'Resend reset code'}
        </button>
      </div>
    </AuthShell>
  )
}

export default ResetPasswordPage
