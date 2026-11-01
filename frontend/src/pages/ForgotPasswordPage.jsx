import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './auth.css'

function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const data = await forgotPassword(email.trim())
      setSent(true)
      if (data?.challengeId) {
        navigate('/reset-password', {
          replace: true,
          state: {
            email: email.trim(),
            challengeId: data.challengeId,
            cooldownSeconds: data.cooldownSeconds,
          },
        })
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot your password?"
      description="Enter your account email and we will send a 6-digit reset code. The code expires in 5 minutes."
      footer={
        <p>
          Remembered it? <Link to="/login">Back to sign in</Link>
        </p>
      }
    >
      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      {sent ? (
        <div className="auth-notice" role="status">
          <p>If that email has an account, a reset code is on its way.</p>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setSent(false)
              setEmail('')
            }}
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-field">
            <span>Email address</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setError('')
              }}
              required
            />
          </label>

          <button className="btn btn--primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send reset code'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}

export default ForgotPasswordPage
