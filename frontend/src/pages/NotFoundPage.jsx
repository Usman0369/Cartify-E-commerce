import { Link } from 'react-router-dom'
import './NotFoundPage.css'

function NotFoundPage() {
  return (
    <section className="not-found">
      <div className="container not-found__inner">
        <span className="eyebrow">404</span>
        <h1>This page has wandered off.</h1>
        <p>
          The page you are looking for does not exist, or it may have moved.
        </p>
        <Link className="btn btn--primary" to="/">
          Back to home
        </Link>
      </div>
    </section>
  )
}

export default NotFoundPage
