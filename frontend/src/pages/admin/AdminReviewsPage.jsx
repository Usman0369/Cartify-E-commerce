import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import {
  AdminFeedback,
  AdminHeader,
  AdminLoading,
  AdminPagination,
  AdminStatus,
  formatAdminDate,
} from './AdminUI.jsx'

function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status) params.set('status', status)
      const data = await api.get(`/admin/reviews?${params.toString()}`)
      setReviews(data?.reviews ?? [])
      setPagination(data?.pagination ?? null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    load()
  }, [load])

  const setReviewStatus = async (review, nextStatus) => {
    setBusyId(review.id)
    setError('')
    setNotice('')
    try {
      const data = await api.patch(`/admin/reviews/${review.id}/status`, {
        status: nextStatus,
      })
      setReviews((current) =>
        current.map((entry) =>
          entry.id === data.review.id ? data.review : entry,
        ),
      )
      setNotice(
        nextStatus === 'approved'
          ? 'Review approved and published.'
          : 'Review rejected.',
      )
      if (status) await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  const removeReview = async (review) => {
    if (!window.confirm('Delete this review permanently?')) return
    setBusyId(review.id)
    setError('')
    setNotice('')
    try {
      await api.delete(`/admin/reviews/${review.id}`)
      setNotice('Review deleted.')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AdminHeader
        eyebrow="Community"
        title="Reviews"
        subtitle="Approve thoughtful feedback and keep the storefront trustworthy."
      />
      <AdminFeedback error={error} notice={notice} />

      <div className="admin-toolbar">
        <div className="admin-toolbar__spacer" />
        <label className="admin-filter">
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="">All reviews</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>

      <section className="admin-panel admin-panel--flush">
        {loading ? (
          <AdminLoading label="Loading reviews..." />
        ) : reviews.length === 0 ? (
          <p className="admin-empty">No reviews in this queue.</p>
        ) : (
          <div className="admin-review-list">
            {reviews.map((review) => (
              <article className="admin-review" key={review.id}>
                <div className="admin-review__head">
                  <div>
                    <div className="admin-review__rating" aria-label={`${review.rating} out of 5 stars`}>
                      {'★'.repeat(review.rating)}
                      <span>{'★'.repeat(5 - review.rating)}</span>
                    </div>
                    <h3>{review.title}</h3>
                    <p>
                      {review.user?.name || 'Customer'} ·{' '}
                      {formatAdminDate(review.createdAt)}
                      {review.verifiedPurchase && ' · Verified purchase'}
                    </p>
                  </div>
                  <AdminStatus status={review.status} />
                </div>
                <p className="admin-review__body">{review.body}</p>
                <footer className="admin-review__foot">
                  <span>Product: {review.productId || 'Unknown'}</span>
                  <div className="admin-row-actions">
                    {review.status !== 'approved' && (
                      <button
                        type="button"
                        className="admin-link-button"
                        disabled={busyId === review.id}
                        onClick={() => setReviewStatus(review, 'approved')}
                      >
                        Approve
                      </button>
                    )}
                    {review.status !== 'rejected' && (
                      <button
                        type="button"
                        className="admin-link-button"
                        disabled={busyId === review.id}
                        onClick={() => setReviewStatus(review, 'rejected')}
                      >
                        Reject
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-link-button admin-link-button--danger"
                      disabled={busyId === review.id}
                      onClick={() => removeReview(review)}
                    >
                      Delete
                    </button>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        )}
        <AdminPagination pagination={pagination} onPage={setPage} />
      </section>
    </>
  )
}

export default ReviewsPage
