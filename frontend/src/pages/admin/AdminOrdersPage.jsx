import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import {
  AdminFeedback,
  AdminHeader,
  AdminLoading,
  AdminPagination,
  AdminStatus,
  formatAdminDateTime,
} from './AdminUI.jsx'

const statuses = [
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Refunded',
]

function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status) params.set('status', status)
      if (search) params.set('search', search)
      const data = await api.get(`/admin/orders?${params.toString()}`)
      setOrders(data?.orders ?? [])
      setPagination(data?.pagination ?? null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [page, status, search])

  useEffect(() => {
    load()
  }, [load])

  const handleSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const handleStatus = async (order, nextStatus) => {
    setBusyId(order.id)
    setError('')
    setNotice('')
    try {
      const data = await api.patch(`/admin/orders/${order.id}/status`, {
        status: nextStatus,
      })
      setOrders((current) =>
        current.map((entry) => (entry.id === data.order.id ? data.order : entry)),
      )
      if (detail?.id === data.order.id) setDetail(data.order)
      setNotice(`Order ${order.id} marked ${nextStatus}.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  const openDetail = async (order) => {
    setDetailLoading(true)
    setDetail(order)
    try {
      const data = await api.get(`/admin/orders/${order.id}`)
      setDetail(data.order)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <>
      <AdminHeader
        eyebrow="Fulfilment"
        title="Orders"
        subtitle="Search orders, review details, and move each one through fulfilment."
      />
      <AdminFeedback error={error} notice={notice} />

      <div className="admin-toolbar">
        <form className="admin-search" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Search order ID, name, or email"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search orders"
          />
          <button className="btn btn--primary btn--small" type="submit">
            Search
          </button>
        </form>

        <label className="admin-filter">
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="">All orders</option>
            {statuses.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="admin-panel admin-panel--flush">
        {loading ? (
          <AdminLoading label="Loading orders..." />
        ) : orders.length === 0 ? (
          <p className="admin-empty">No orders match this view.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Placed</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <button
                        type="button"
                        className="admin-link-button"
                        onClick={() => openDetail(order)}
                      >
                        {order.id}
                      </button>
                    </td>
                    <td>
                      <strong className="admin-cell-title">
                        {order.contact?.firstName} {order.contact?.lastName}
                      </strong>
                      <span className="admin-cell-sub">{order.contact?.email}</span>
                    </td>
                    <td>{formatAdminDateTime(order.createdAt)}</td>
                    <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>
                      <select
                        className="admin-status-select"
                        value={order.status}
                        disabled={busyId === order.id}
                        onChange={(event) => handleStatus(order, event.target.value)}
                        aria-label={`Status for ${order.id}`}
                      >
                        {statuses.map((entry) => (
                          <option key={entry} value={entry}>
                            {entry}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-link-button"
                        onClick={() => openDetail(order)}
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
            className="admin-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Order ${detail.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="admin-drawer__head">
              <div>
                <span>Order</span>
                <h2>{detail.id}</h2>
                <p>{formatAdminDateTime(detail.createdAt)}</p>
              </div>
              <button
                type="button"
                className="admin-drawer__close"
                onClick={() => setDetail(null)}
                aria-label="Close order details"
              >
                ×
              </button>
            </header>

            {detailLoading ? (
              <AdminLoading label="Loading order..." />
            ) : (
              <>
                <div className="admin-drawer__status">
                  <AdminStatus status={detail.status} />
                  <strong>{formatCurrency(detail.total)}</strong>
                </div>

                <section className="admin-drawer__section">
                  <h3>Customer</h3>
                  <p>
                    {detail.contact?.firstName} {detail.contact?.lastName}
                  </p>
                  <p>{detail.contact?.email}</p>
                  {detail.contact?.phone && <p>{detail.contact.phone}</p>}
                </section>

                <section className="admin-drawer__section">
                  <h3>Shipping</h3>
                  <p>
                    {detail.shippingAddress?.address1}
                    {detail.shippingAddress?.address2
                      ? `, ${detail.shippingAddress.address2}`
                      : ''}
                  </p>
                  <p>
                    {detail.shippingAddress?.city},{' '}
                    {detail.shippingAddress?.region}{' '}
                    {detail.shippingAddress?.postalCode}
                  </p>
                  <p>{detail.shippingAddress?.country}</p>
                  <p>{detail.delivery?.label}</p>
                </section>

                <section className="admin-drawer__section">
                  <h3>Items</h3>
                  <ul className="admin-drawer__items">
                    {detail.items?.map((item) => (
                      <li key={`${detail.id}-${item.productId}`}>
                        <img src={item.image} alt="" />
                        <div>
                          <strong>{item.name}</strong>
                          <span>
                            {item.quantity} × {formatCurrency(item.price)}
                          </span>
                        </div>
                        <b>{formatCurrency(item.lineTotal)}</b>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="admin-drawer__section">
                  <h3>Summary</h3>
                  <dl className="admin-totals">
                    <div>
                      <dt>Subtotal</dt>
                      <dd>{formatCurrency(detail.subtotal)}</dd>
                    </div>
                    {detail.discount > 0 && (
                      <div>
                        <dt>Discount {detail.promo?.code && `(${detail.promo.code})`}</dt>
                        <dd>-{formatCurrency(detail.discount)}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Shipping</dt>
                      <dd>
                        {detail.shipping === 0
                          ? 'Free'
                          : formatCurrency(detail.shipping)}
                      </dd>
                    </div>
                    <div className="admin-totals__total">
                      <dt>Total</dt>
                      <dd>{formatCurrency(detail.total)}</dd>
                    </div>
                  </dl>
                </section>

                <section className="admin-drawer__section">
                  <h3>Update status</h3>
                  <select
                    className="admin-status-select admin-status-select--wide"
                    value={detail.status}
                    disabled={busyId === detail.id}
                    onChange={(event) => handleStatus(detail, event.target.value)}
                  >
                    {statuses.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
                  </select>
                </section>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  )
}

export default OrdersPage
