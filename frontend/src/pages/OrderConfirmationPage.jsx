import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRightIcon,
  CheckIcon,
  MailIcon,
  PinIcon,
  ShieldIcon,
  TruckIcon,
} from '../components/Icons.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api, apiEnabled } from '../services/api.js'
import {
  getOrder,
  getOrderAccess,
  saveOrder,
} from '../services/orders.js'
import { formatCurrency } from '../utils/formatCurrency.js'
import './OrderConfirmationPage.css'

function OrderConfirmationPage() {
  const { orderId } = useParams()
  const { isAuthenticated } = useAuth()
  const storedOrder = getOrder(orderId)
  const [remoteOrder, setRemoteOrder] = useState(null)
  const access = getOrderAccess(orderId)
  const canLookup = apiEnabled && (isAuthenticated || Boolean(access?.token))
  const [loading, setLoading] = useState(canLookup && !storedOrder)

  useEffect(() => {
    if (!apiEnabled || !orderId) return undefined

    const guestAccess = getOrderAccess(orderId)
    if (!isAuthenticated && !guestAccess?.token) return undefined

    let cancelled = false
    setLoading(true)

    const request = isAuthenticated
      ? api.get(`/orders/${orderId}`)
      : api.post(`/orders/guest/${orderId}`, {
          email: guestAccess.email,
          token: guestAccess.token,
        })

    request
      .then((data) => {
        if (cancelled || !data?.order) return
        setRemoteOrder(data.order)
        saveOrder(data.order)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [orderId, isAuthenticated])

  const order = remoteOrder ?? storedOrder

  if (loading && !order) {
    return (
      <section className="section confirmation">
        <div className="container confirmation__missing">
          <p role="status">Loading order details...</p>
        </div>
      </section>
    )
  }

  if (!order) {
    return (
      <section className="section confirmation">
        <div className="container confirmation__missing">
          <span className="eyebrow">Order lookup</span>
          <h1 className="confirmation__title">Order not found</h1>
          <p>
            We could not find an order with that ID. It may have been removed
            from this browser, or the link may be incorrect.
          </p>
          <div className="confirmation__actions">
            <Link className="btn btn--primary" to="/shop">
              Continue shopping
            </Link>
            <Link className="btn btn--outline" to="/">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const placedAt = new Date(order.createdAt)
  const placedLabel = Number.isNaN(placedAt.getTime())
    ? ''
    : placedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
  const { contact, shippingAddress, delivery, payment } = order
  const name = [contact?.firstName, contact?.lastName]
    .filter(Boolean)
    .join(' ')

  return (
    <section className="section confirmation">
      <div className="container">
        <div className="confirmation__hero">
          <span className="confirmation__icon" aria-hidden="true">
            <CheckIcon />
          </span>
          <span className="eyebrow">Order {order.status.toLowerCase()}</span>
          <h1 className="confirmation__title">Order confirmed</h1>
          <p className="confirmation__lead">
            Thank you{name ? `, ${contact.firstName}` : ''}. Your order is
            confirmed and will be prepared for delivery.
          </p>

          <div className="confirmation__meta">
            <span>
              Order ID <strong>{order.id}</strong>
            </span>
            <span>
              Status <strong>{order.status}</strong>
            </span>
            {placedLabel && (
              <span>
                Placed <strong>{placedLabel}</strong>
              </span>
            )}
          </div>

          <div className="confirmation__actions">
            <Link className="btn btn--primary" to="/shop">
              Continue shopping
              <ArrowRightIcon />
            </Link>
            <Link className="btn btn--outline" to="/">
              Back to home
            </Link>
          </div>
        </div>

        <div className="confirmation__layout">
          <div className="confirmation__main">
            <section
              className="confirmation__panel"
              aria-labelledby="items-title"
            >
              <div className="confirmation__panel-head">
                <h2 className="confirmation__panel-title" id="items-title">
                  Your items
                </h2>
                <span className="confirmation__item-count">
                  {order.items.length}{' '}
                  {order.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <ul className="confirmation__items">
                {order.items.map((item) => (
                  <li
                    className="confirmation-item"
                    key={`${item.productId}-${item.quantity}`}
                  >
                    <img
                      className="confirmation-item__image"
                      src={item.image}
                      alt={item.name}
                    />
                    <div className="confirmation-item__body">
                      <span className="confirmation-item__brand">
                        {item.brand}
                      </span>
                      <span className="confirmation-item__name">
                        {item.name}
                      </span>
                      <span className="confirmation-item__meta">
                        {item.quantity} x {formatCurrency(item.price)}
                      </span>
                    </div>
                    <span className="confirmation-item__total">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="confirmation__totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatCurrency(order.subtotal)}</dd>
                </div>
                {order.promo && order.discount > 0 && (
                  <div className="confirmation__discount">
                    <dt>Discount ({order.promo})</dt>
                    <dd>-{formatCurrency(order.discount)}</dd>
                  </div>
                )}
                <div>
                  <dt>Shipping</dt>
                  <dd>
                    {order.shipping === 0
                      ? 'Free'
                      : formatCurrency(order.shipping)}
                  </dd>
                </div>
                <div className="confirmation__total-row">
                  <dt>Total</dt>
                  <dd>{formatCurrency(order.total)}</dd>
                </div>
              </dl>
            </section>

            <section
              className="confirmation__panel"
              aria-labelledby="details-title"
            >
              <h2 className="confirmation__panel-title" id="details-title">
                Delivery details
              </h2>

              <div className="confirmation__details">
                <div className="confirmation__detail">
                  <span className="confirmation__detail-icon">
                    <PinIcon />
                  </span>
                  <div>
                    <h3>Shipping address</h3>
                    <address>
                      {name && <span>{name}</span>}
                      <span>{shippingAddress.address1}</span>
                      {shippingAddress.address2 && (
                        <span>{shippingAddress.address2}</span>
                      )}
                      <span>
                        {shippingAddress.city}, {shippingAddress.region}{' '}
                        {shippingAddress.postalCode}
                      </span>
                      <span>{shippingAddress.country}</span>
                    </address>
                  </div>
                </div>

                <div className="confirmation__detail">
                  <span className="confirmation__detail-icon">
                    <MailIcon />
                  </span>
                  <div>
                    <h3>Contact</h3>
                    <p>{contact.email}</p>
                    {contact.phone && <p>{contact.phone}</p>}
                  </div>
                </div>

                <div className="confirmation__detail">
                  <span className="confirmation__detail-icon">
                    <TruckIcon />
                  </span>
                  <div>
                    <h3>Delivery method</h3>
                    <p>{delivery.label}</p>
                    <p className="confirmation__muted">
                      {delivery.description}
                    </p>
                  </div>
                </div>

                <div className="confirmation__detail">
                  <span className="confirmation__detail-icon">
                    <ShieldIcon />
                  </span>
                  <div>
                    <h3>Payment</h3>
                    <p>
                      {payment.brand} ending in {payment.last4}
                    </p>
                    <p className="confirmation__muted">
                      Demo payment - no charge was made.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside
            className="confirmation__note"
            aria-label="What happens next"
          >
            <h2 className="confirmation__panel-title">What happens next</h2>
            <p>
              This is a demo order. If you signed in, it is also available from
              your account. In a live store you would receive an email
              confirmation and tracking updates.
            </p>
            <ul>
              <li>
                <CheckIcon />
                Order saved with status {order.status.toLowerCase()}
              </li>
              <li>
                <CheckIcon />
                Cart cleared after checkout
              </li>
              <li>
                <CheckIcon />
                Card details never stored
              </li>
            </ul>
            <Link className="cart__continue" to="/shop">
              Continue shopping
            </Link>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default OrderConfirmationPage
