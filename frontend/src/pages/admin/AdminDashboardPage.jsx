import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import {
  AdminFeedback,
  AdminHeader,
  AdminLoading,
  AdminStatus,
  formatAdminDateTime,
} from './AdminUI.jsx'

function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .get('/admin/dashboard')
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <AdminLoading label="Loading your dashboard..." />

  const stats = data?.stats
  const monthly = data?.monthlySales ?? []
  const maxRevenue = Math.max(...monthly.map((entry) => entry.revenue), 1)
  const recentOrders = data?.recentOrders ?? []
  const activity = data?.recentActivity ?? []
  const topProducts = data?.topProducts ?? []
  const lowStock = data?.lowStock ?? []

  return (
    <>
      <AdminHeader
        eyebrow="Overview"
        title="Store dashboard"
        subtitle="A clear look at sales, stock, and what needs your attention."
        actions={
          <Link className="btn btn--outline" to="/admin/products">
            Manage products
          </Link>
        }
      />
      <AdminFeedback error={error} />

      {stats && (
        <div className="admin-stats">
          <article className="admin-stat-card admin-stat-card--feature">
            <span>Total revenue</span>
            <strong>{formatCurrency(stats.revenue)}</strong>
            <p>{stats.paidOrders} paid orders</p>
          </article>
          <article className="admin-stat-card">
            <span>Orders</span>
            <strong>{stats.totalOrders}</strong>
            <p>All time</p>
          </article>
          <article className="admin-stat-card">
            <span>Customers</span>
            <strong>{stats.totalCustomers}</strong>
            <p>Registered accounts</p>
          </article>
          <article className="admin-stat-card">
            <span>Active products</span>
            <strong>{stats.totalProducts}</strong>
            <p>{stats.lowStockCount} low on stock</p>
          </article>
          <article className="admin-stat-card">
            <span>Reviews to moderate</span>
            <strong>{stats.pendingReviews}</strong>
            <p>
              <Link to="/admin/reviews">Review queue</Link>
            </p>
          </article>
        </div>
      )}

      <div className="admin-grid admin-grid--two">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Monthly revenue</h2>
            <span>Last 6 months</span>
          </div>
          {monthly.length === 0 ? (
            <p className="admin-empty">No sales recorded yet.</p>
          ) : (
            <div className="admin-chart">
              {monthly.map((entry) => (
                <div className="admin-chart__bar" key={entry._id}>
                  <span className="admin-chart__value">
                    {formatCurrency(entry.revenue)}
                  </span>
                  <div className="admin-chart__track">
                    <span
                      style={{
                        height: `${Math.max(8, (entry.revenue / maxRevenue) * 100)}%`,
                      }}
                    />
                  </div>
                  <small>
                    {new Date(`${entry._id}-02`).toLocaleDateString('en-US', {
                      month: 'short',
                    })}
                  </small>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Top products</h2>
            <Link to="/admin/products">All products</Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="admin-empty">Product performance appears here.</p>
          ) : (
            <ul className="admin-top-products">
              {topProducts.map((product) => (
                <li key={product._id}>
                  <img src={product.image} alt="" />
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.quantity} sold</span>
                  </div>
                  <b>{formatCurrency(product.revenue)}</b>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="admin-grid admin-grid--two">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Recent orders</h2>
            <Link to="/admin/orders">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="admin-empty">No orders yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table admin-table--compact">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link to="/admin/orders">{order.id}</Link>
                      </td>
                      <td>
                        {order.contact?.firstName} {order.contact?.lastName}
                      </td>
                      <td>{formatCurrency(order.total)}</td>
                      <td>
                        <AdminStatus status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Low stock</h2>
            <Link to="/admin/products">Restock</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="admin-empty">Every active product is well stocked.</p>
          ) : (
            <ul className="admin-stock-list">
              {lowStock.map((product) => (
                <li key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.brand}</span>
                  </div>
                  <b>{product.stock} left</b>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>Recent activity</h2>
          <Link to="/admin/activity">Full log</Link>
        </div>
        {activity.length === 0 ? (
          <p className="admin-empty">Activity will appear as your store is used.</p>
        ) : (
          <ul className="admin-activity">
            {activity.map((entry) => (
              <li key={entry._id}>
                <span className="admin-activity__dot" aria-hidden="true" />
                <div>
                  <strong>{entry.message}</strong>
                  <span>
                    {entry.actor?.name || 'System'} ·{' '}
                    {formatAdminDateTime(entry.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default DashboardPage
