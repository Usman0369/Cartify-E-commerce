import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckIcon, StarIcon } from './Icons.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { api, apiEnabled } from '../services/api.js'
import './ProductReviews.css'

function RatingStars({ rating }) {
  return (
    <span className="product-reviews__stars" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          className={index < Math.round(rating) ? 'is-filled' : ''}
        />
      ))}
    </span>
  )
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function ProductReviews({ product }) {
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(apiEnabled)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState({ rating: '5', title: '', body: '' })
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!apiEnabled || !product?.id) return undefined

    let cancelled = false
    setLoading(true)
    setLoadError('')

    api
      .get(`/reviews/product/${product.slug ?? product.id}?limit=10`)
      .then((data) => {
        if (!cancelled) setReviews(data?.reviews ?? [])
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [product?.id, product?.slug])

  if (!apiEnabled) return null

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target
    setForm((current) => ({ ...current, [field]: value }))
    setFormError('')
    setNotice('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    setNotice('')

    if (form.body.trim().length < 10) {
      setFormError('Share a little more detail about your experience.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/reviews', {
        productId: product.id,
        rating: Number(form.rating),
        title: form.title.trim(),
        body: form.body.trim(),
      })
      setForm({ rating: '5', title: '', body: '' })
      setNotice('Thanks! Your review is awaiting moderation.')
      showToast('Review submitted for moderation.')
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const rating = Number(product.rating) || 0
  const reviewCount = Number(product.reviews) || 0

  return (
    <section className="section product-reviews" aria-labelledby="reviews-title">
      <div className="container">
        <div className="product-reviews__head">
          <div>
            <span className="eyebrow">Customer feedback</span>
            <h2 className="product-reviews__title" id="reviews-title">
              Reviews
            </h2>
            <div
              className="product-reviews__summary"
              aria-label={`Rated ${rating} out of 5 from ${reviewCount} reviews`}
            >
              <RatingStars rating={rating} />
              <strong>{rating.toFixed(1)}</strong>
              <span>
                {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>
        </div>

        <div className="product-reviews__layout">
          <div className="product-reviews__list-panel">
            {loading ? (
              <p className="product-reviews__state" role="status">
                Loading reviews...
              </p>
            ) : loadError ? (
              <p className="product-reviews__state product-reviews__state--error">
                {loadError}
              </p>
            ) : reviews.length === 0 ? (
              <p className="product-reviews__state">
                No published reviews yet. Be the first to share your thoughts.
              </p>
            ) : (
              <ul className="product-reviews__list">
                {reviews.map((review) => (
                  <li className="product-review" key={review.id}>
                    <div className="product-review__head">
                      <div>
                        <strong className="product-review__author">
                          {review.user?.name || 'Cartify customer'}
                        </strong>
                        <span className="product-review__date">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <RatingStars rating={review.rating} />
                    </div>
                    {review.title && (
                      <h3 className="product-review__title">{review.title}</h3>
                    )}
                    <p className="product-review__body">{review.body}</p>
                    {review.verifiedPurchase && (
                      <span className="product-review__verified">
                        <CheckIcon />
                        Verified purchase
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <aside className="product-reviews__form-panel">
            <h3>Write a review</h3>
            {isAuthenticated ? (
              <form className="product-reviews__form" onSubmit={handleSubmit}>
                <label className="product-reviews__field">
                  <span>Rating</span>
                  <select
                    value={form.rating}
                    onChange={handleFieldChange('rating')}
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Okay</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Bad</option>
                  </select>
                </label>

                <label className="product-reviews__field">
                  <span>Title (optional)</span>
                  <input
                    type="text"
                    maxLength={120}
                    value={form.title}
                    onChange={handleFieldChange('title')}
                  />
                </label>

                <label className="product-reviews__field">
                  <span>Your review</span>
                  <textarea
                    rows={5}
                    minLength={10}
                    maxLength={2000}
                    required
                    value={form.body}
                    onChange={handleFieldChange('body')}
                  />
                </label>

                {formError && (
                  <p className="product-reviews__error" role="alert">
                    {formError}
                  </p>
                )}
                {notice && (
                  <p className="product-reviews__notice" role="status">
                    {notice}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit review'}
                </button>
              </form>
            ) : (
              <div className="product-reviews__signin">
                <p>Sign in to share your experience with this product.</p>
                <Link
                  className="btn btn--outline"
                  to={`/login?redirect=${encodeURIComponent(
                    `/product/${product.slug ?? product.id}`,
                  )}`}
                >
                  Sign in to review
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  )
}

export default ProductReviews
