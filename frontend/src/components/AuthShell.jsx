import { Link } from 'react-router-dom'

function AuthShell({ eyebrow, title, description, children, footer }) {
  return (
    <section className="section auth-page">
      <div className="container auth-page__inner">
        <div className="auth-card">
          <Link className="auth-card__brand" to="/" aria-label="Cartify home">
            <span aria-hidden="true">C</span>
            Cartify
          </Link>
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="auth-card__title">{title}</h1>
          {description && <p className="auth-card__copy">{description}</p>}
          {children}
          {footer && <div className="auth-card__footer">{footer}</div>}
        </div>
      </div>
    </section>
  )
}

export default AuthShell
