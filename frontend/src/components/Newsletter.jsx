import { useState } from 'react'
import { CheckIcon, MailIcon } from './Icons.jsx'
import './Newsletter.css'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Newsletter() {
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedEmail = email.trim()

    if (!emailPattern.test(trimmedEmail)) {
      setFeedback({
        type: 'error',
        message: 'Please enter a valid email address.',
      })
      return
    }

    setFeedback({
      type: 'success',
      message: 'You\u2019re on the list. Welcome to Cartify.',
    })
    setEmail('')
  }

  return (
    <section className="newsletter" aria-labelledby="newsletter-title">
      <div className="container">
        <div className="newsletter__panel">
          <div className="newsletter__content">
            <span className="eyebrow eyebrow--light">The Cartify letter</span>
            <h2 className="newsletter__title" id="newsletter-title">
              A little good mail.
            </h2>
            <p className="newsletter__description">
              New arrivals, considered edits, and quiet offers — delivered
              occasionally. No noise, just the good stuff.
            </p>
          </div>

          <div className="newsletter__form-wrap">
            {feedback.type === 'success' ? (
              <div className="newsletter__success" role="status">
                <span className="newsletter__success-icon" aria-hidden="true">
                  <CheckIcon />
                </span>
                <div>
                  <strong>You&apos;re on the list.</strong>
                  <p>{feedback.message}</p>
                </div>
              </div>
            ) : (
              <>
                <form className="newsletter__form" onSubmit={handleSubmit} noValidate>
                  <label className="sr-only" htmlFor="newsletter-email">
                    Email address
                  </label>
                  <div className="newsletter__input-wrap">
                    <MailIcon />
                    <input
                      id="newsletter-email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        if (feedback.type) {
                          setFeedback({ type: '', message: '' })
                        }
                      }}
                      placeholder="Your email address"
                      aria-invalid={feedback.type === 'error'}
                      aria-describedby="newsletter-help"
                      autoComplete="email"
                    />
                  </div>
                  <button type="submit" className="btn btn--light">
                    Subscribe
                  </button>
                </form>
                <p
                  className={`newsletter__help ${
                    feedback.type === 'error' ? 'is-error' : ''
                  }`}
                  id="newsletter-help"
                  aria-live="polite"
                >
                  {feedback.type === 'error'
                    ? feedback.message
                    : 'Unsubscribe anytime. We only send the good stuff.'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Newsletter
