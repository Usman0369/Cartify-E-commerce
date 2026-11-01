import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AuthShell from '../components/AuthShell.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './auth.css'

function useCooldown(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    if (seconds <= 0) return undefined
    const timer = window.setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [seconds])

  return [seconds, setSeconds]
}

function VerifyEmailPage() {
  const { verifyEmail, resendOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(
    location.state?.email || searchParams.get('email') || '',
  )
  const [challengeId, setChallengeId] = useState(
    location.state?.challengeId || '',
  )
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [seconds, setSeconds] = useCooldown(
    Number(location.state?.cooldownSeconds) || 0,
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (code.trim().length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }

    setSubmitting(true)
    try {
      await verifyEmail({ email: email.trim(), code: code.trim(), challengeId })
      navigate('/login', {
        replace: true,
        state: { message: 'Email verified. Sign in to continue.' },
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
        purpose: 'email_verify',
      })
      if (data?.challengeId) setChallengeId(data.challengeId)
      setSeconds(data?.cooldownSeconds || 60)
      setNotice('A new verification code is on its way.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <AuthShell
      eyebrow="One quick step"
      title="Verify your email"
      description={`Enter the 6-digit code we sent to ${email || 'your inbox'}. The code expires in 5 minutes.`}
      footer={
        <p>
          Wrong address? <Link to="/register">Start again</Link>
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
          <span>Verification code</span>
          <input
            className="auth-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
            }
            required
          />
        </label>

        <button className="btn btn--primary auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'Verifying...' : 'Verify email'}
        </button>
      </form>

      <div className="auth-resend">
        <button
          type="button"
          className="link-button"
          onClick={handleResend}
          disabled={seconds > 0}
        >
          {seconds > 0 ? `Resend code in ${seconds}s` : 'Resend code'}
        </button>
      </div>
    </AuthShell>
  )
}

export default VerifyEmailPage
