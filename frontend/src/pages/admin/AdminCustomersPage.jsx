import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { api } from '../../services/api.js'
import {
  AdminFeedback,
  AdminHeader,
  AdminLoading,
  AdminPagination,
  formatAdminDate,
} from './AdminUI.jsx'

function CustomersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [role, setRole] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (role) params.set('role', role)
      if (search) params.set('search', search)
      const data = await api.get(`/admin/users?${params.toString()}`)
      setUsers(data?.users ?? [])
      setPagination(data?.pagination ?? null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [page, role, search])

  useEffect(() => {
    load()
  }, [load])

  const updateUser = async (target, changes) => {
    setBusyId(target.id)
    setError('')
    setNotice('')
    try {
      const data = await api.patch(`/admin/users/${target.id}`, changes)
      setUsers((current) =>
        current.map((entry) => (entry.id === data.user.id ? data.user : entry)),
      )
      if (detail?.user?.id === data.user.id) {
        setDetail((current) => ({ ...current, user: data.user }))
      }
      setNotice(`${data.user.name} updated.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  const openDetail = async (user) => {
    setDetail({ user, orderCount: null })
    try {
      const data = await api.get(`/admin/users/${user.id}`)
      setDetail(data)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <>
      <AdminHeader
        eyebrow="People"
        title="Customers"
        subtitle="Manage accounts, access levels, and account status."
      />
      <AdminFeedback error={error} notice={notice} />

      <div className="admin-toolbar">
        <form
          className="admin-search"
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            setSearch(searchInput.trim())
          }}
        >
          <input
            type="search"
            placeholder="Search by name or email"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search customers"
          />
          <button className="btn btn--primary btn--small" type="submit">
            Search
          </button>
        </form>

        <label className="admin-filter">
          <span>Role</span>
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value)
              setPage(1)
            }}
          >
            <option value="">Everyone</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
          </select>
        </label>
      </div>

      <section className="admin-panel admin-panel--flush">
        {loading ? (
          <AdminLoading label="Loading customers..." />
        ) : users.length === 0 ? (
          <p className="admin-empty">No accounts match this view.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Role</th>
                  <th>Email verified</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <button
                        type="button"
                        className="admin-link-button"
                        onClick={() => openDetail(user)}
                      >
                        <strong className="admin-cell-title">{user.name}</strong>
                        <span className="admin-cell-sub">{user.email}</span>
                      </button>
                    </td>
                    <td>
                      <select
                        className="admin-status-select"
                        value={user.role}
                        disabled={busyId === user.id || user.id === currentUser?.id}
                        onChange={(event) =>
                          updateUser(user, { role: event.target.value })
                        }
                        aria-label={`Role for ${user.name}`}
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{user.emailVerified ? 'Yes' : 'No'}</td>
                    <td>{formatAdminDate(user.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className={`admin-toggle ${user.active ? 'is-on' : ''}`}
                        disabled={busyId === user.id || user.id === currentUser?.id}
                        onClick={() => updateUser(user, { active: !user.active })}
                        aria-label={`${user.active ? 'Deactivate' : 'Activate'} ${user.name}`}
                      >
                        <span />
                        {user.active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-link-button"
                        onClick={() => openDetail(user)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination pagination={pagination} onPage={setPage} />
      </section>

      {detail && (
        <div className="admin-drawer-backdrop" role="presentation" onClick={() => setDetail(null)}>
          <aside
            className="admin-drawer admin-drawer--narrow"
            role="dialog"
            aria-modal="true"
            aria-label={`Customer ${detail.user.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="admin-drawer__head">
              <div>
                <span>Customer</span>
                <h2>{detail.user.name}</h2>
                <p>{detail.user.email}</p>
              </div>
              <button
                type="button"
                className="admin-drawer__close"
                onClick={() => setDetail(null)}
                aria-label="Close customer details"
              >
                ×
              </button>
            </header>
            <div className="admin-drawer__section">
              <dl className="admin-detail-list">
                <div>
                  <dt>Role</dt>
                  <dd>{detail.user.role}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{detail.user.active ? 'Active' : 'Disabled'}</dd>
                </div>
                <div>
                  <dt>Email verified</dt>
                  <dd>{detail.user.emailVerified ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt>Two-factor authentication</dt>
                  <dd>{detail.user.twoFactorEnabled ? 'Enabled' : 'Off'}</dd>
                </div>
                <div>
                  <dt>Joined</dt>
                  <dd>{formatAdminDate(detail.user.createdAt)}</dd>
                </div>
                <div>
                  <dt>Last sign-in</dt>
                  <dd>{formatAdminDate(detail.user.lastLoginAt)}</dd>
                </div>
                <div>
                  <dt>Orders</dt>
                  <dd>{detail.orderCount ?? '…'}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

export default CustomersPage
