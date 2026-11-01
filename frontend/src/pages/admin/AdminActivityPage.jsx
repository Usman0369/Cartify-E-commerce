import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import {
  AdminFeedback,
  AdminHeader,
  AdminLoading,
  AdminPagination,
  formatAdminDateTime,
} from './AdminUI.jsx'

function ActivityPage() {
  const [activity, setActivity] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get(`/admin/activity?page=${page}&limit=30`)
      setActivity(data?.activity ?? [])
      setPagination(data?.pagination ?? null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  return (
    <>
      <AdminHeader
        eyebrow="Audit trail"
        title="Activity"
        subtitle="A chronological record of store and account events."
      />
      <AdminFeedback error={error} />

      <section className="admin-panel">
        {loading ? (
          <AdminLoading label="Loading activity..." />
        ) : activity.length === 0 ? (
          <p className="admin-empty">No activity has been recorded yet.</p>
        ) : (
          <ol className="admin-timeline">
            {activity.map((entry) => (
              <li key={entry._id}>
                <span className="admin-timeline__marker" aria-hidden="true" />
                <div className="admin-timeline__body">
                  <div className="admin-timeline__head">
                    <strong>{entry.message}</strong>
                    <span>{formatAdminDateTime(entry.createdAt)}</span>
                  </div>
                  <p>
                    <span className="admin-type">{entry.type}</span>
                    {entry.actor?.name && ` · ${entry.actor.name}`}
                    {entry.actor?.email && ` (${entry.actor.email})`}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
        <AdminPagination pagination={pagination} onPage={setPage} />
      </section>
    </>
  )
}

export default ActivityPage
