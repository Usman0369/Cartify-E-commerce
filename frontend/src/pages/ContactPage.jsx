import { useState } from 'react'
import {
  CheckIcon,
  ClockIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  SupportIcon,
} from '../components/Icons.jsx'
import PageIntro from '../components/PageIntro.jsx'
import { isValidEmail, required } from '../utils/validation.js'
import './ContactPage.css'

const initialForm = {
  name: '',
  email: '',
  topic: 'Order support',
  message: '',
}

const topics = [
  'Order support',
  'Returns and exchanges',
  'Product question',
  'Something else',
]

function ContactPage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)

  const handleChange = (name) => (event) => {
    const { value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
    setFeedback(null)
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = {}
    const name = form.name.trim()
    const email = form.email.trim()
    const message = form.message.trim()

    if (!required(name)) {
      nextErrors.name = 'Please enter your name.'
    }

    if (!required(email)) {
      nextErrors.email = 'Email address is required.'
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!required(message)) {
      nextErrors.message = 'Please enter a message.'
    } else if (message.length < 10) {
      nextErrors.message =
        'Please include a little more detail (at least 10 characters).'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setFeedback({
      name,
      email,
      topic: form.topic,
    })
    setForm(initialForm)
    setErrors({})
  }

  return (
    <>
      <PageIntro
        eyebrow="We are here to help"
        title="Contact us"
        description="Questions about an order, a product, or a return? Send us a note and a real person from the Cartify team will get back to you within one business day."
      />

      <section className="section contact-page">
        <div className="container contact-page__layout">
          <div className="contact-page__form-panel">
            <div className="contact-page__panel-head">
              <h2 className="contact-page__panel-title">Send a message</h2>
              <span className="contact-page__demo-badge">Demo form</span>
            </div>
            <p className="contact-page__panel-copy">
              This is a front-end demo, so messages are not sent anywhere. The
              form is fully validated and shows the success state.
            </p>

            {feedback && (
              <div className="contact-page__success" role="status">
                <span
                  className="contact-page__success-icon"
                  aria-hidden="true"
                >
                  <CheckIcon />
                </span>
                <div>
                  <strong>Thanks, {feedback.name}.</strong>
                  <p>
                    Your {feedback.topic.toLowerCase()} message has been
                    recorded. We would normally reply to {feedback.email} within
                    one business day.
                  </p>
                </div>
              </div>
            )}

            <form className="contact-page__form" onSubmit={handleSubmit} noValidate>
              <div className="contact-page__grid">
                <div className="contact-field">
                  <label className="contact-field__label" htmlFor="contact-name">
                    Full name
                  </label>
                  <input
                    id="contact-name"
                    className="contact-input"
                    type="text"
                    value={form.name}
                    onChange={handleChange('name')}
                    autoComplete="name"
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={
                      errors.name ? 'contact-name-error' : undefined
                    }
                  />
                  {errors.name && (
                    <p
                      className="contact-field__error"
                      id="contact-name-error"
                      role="alert"
                    >
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="contact-field">
                  <label
                    className="contact-field__label"
                    htmlFor="contact-email"
                  >
                    Email address
                  </label>
                  <input
                    id="contact-email"
                    className="contact-input"
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    autoComplete="email"
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={
                      errors.email ? 'contact-email-error' : undefined
                    }
                  />
                  {errors.email && (
                    <p
                      className="contact-field__error"
                      id="contact-email-error"
                      role="alert"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="contact-field contact-field--full">
                  <label
                    className="contact-field__label"
                    htmlFor="contact-topic"
                  >
                    Topic
                  </label>
                  <select
                    id="contact-topic"
                    className="contact-input"
                    value={form.topic}
                    onChange={handleChange('topic')}
                  >
                    {topics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="contact-field contact-field--full">
                  <label
                    className="contact-field__label"
                    htmlFor="contact-message"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    className="contact-input contact-input--textarea"
                    rows={6}
                    value={form.message}
                    onChange={handleChange('message')}
                    aria-invalid={errors.message ? true : undefined}
                    aria-describedby={
                      errors.message ? 'contact-message-error' : undefined
                    }
                  />
                  {errors.message && (
                    <p
                      className="contact-field__error"
                      id="contact-message-error"
                      role="alert"
                    >
                      {errors.message}
                    </p>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn--primary">
                Send message
              </button>
            </form>
          </div>

          <aside className="contact-page__info" aria-label="Contact information">
            <div className="contact-page__info-card">
              <span className="contact-page__info-icon" aria-hidden="true">
                <SupportIcon />
              </span>
              <h2 className="contact-page__panel-title">Talk to a human</h2>
              <p className="contact-page__panel-copy">
                Our small support team is available seven days a week.
              </p>

              <ul className="contact-page__contact-list">
                <li>
                  <MailIcon />
                  <div>
                    <span>Email</span>
                    <a href="mailto:hello@cartify.shop">
                      hello@cartify.shop
                    </a>
                  </div>
                </li>
                <li>
                  <PhoneIcon />
                  <div>
                    <span>Phone</span>
                    <a href="tel:+15550142890">+1 (555) 014-2890</a>
                  </div>
                </li>
                <li>
                  <PinIcon />
                  <div>
                    <span>Studio</span>
                    <p>24 Alder Lane, Portland, OR</p>
                  </div>
                </li>
                <li>
                  <ClockIcon />
                  <div>
                    <span>Hours</span>
                    <p>Mon-Sun, 9am to 6pm PT</p>
                  </div>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="section section--soft contact-page__faq">
        <div className="container">
          <div className="contact-page__faq-head">
            <span className="eyebrow">Quick answers</span>
            <h2 className="contact-page__faq-title">Before you write</h2>
          </div>

          <div className="contact-page__faq-grid">
            <article className="contact-page__faq-card">
              <h3>Where is my order?</h3>
              <p>
                Demo orders are saved in your browser and can be viewed from
                the confirmation page. Live tracking arrives with the backend.
              </p>
            </article>
            <article className="contact-page__faq-card">
              <h3>What is your returns policy?</h3>
              <p>
                Unused items can be returned within 30 days for a full refund.
                Start a return by emailing our support team.
              </p>
            </article>
            <article className="contact-page__faq-card">
              <h3>When is shipping free?</h3>
              <p>
                Standard shipping is free on merchandise subtotals of $75 or
                more. Express delivery adds a flat surcharge at checkout.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  )
}

export default ContactPage
