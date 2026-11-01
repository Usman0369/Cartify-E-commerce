import { useState } from 'react'
import {
  CheckIcon,
  ReturnIcon,
  ShieldIcon,
  TruckIcon,
} from './Icons.jsx'
import {
  FREE_SHIPPING_THRESHOLD,
  useCart,
} from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'
import { roundMoney } from '../utils/money.js'
import './OrderSummary.css'

function OrderSummary({
  title = 'Order summary',
  shipping: shippingOverride,
  showPromoForm = false,
  showPerks = false,
  action = null,
  note = 'Taxes are calculated at checkout.',
  className = '',
}) {
  const {
    subtotal,
    discount,
    shipping: cartShipping,
    amountToFreeShipping,
    promo,
    applyPromo,
    removePromo,
  } = useCart()
  const { showToast } = useToast()
  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState('')

  const shipping = Number.isFinite(shippingOverride)
    ? shippingOverride
    : cartShipping
  const total = Math.max(0, roundMoney(subtotal - discount + shipping))
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)

  const handleApplyPromo = (event) => {
    event.preventDefault()

    if (applyPromo(promoInput)) {
      setPromoError('')
      setPromoInput('')
      showToast('Promo code WARM20 applied.')
      return
    }

    setPromoError('That promo code is not valid. Try WARM20.')
  }

  const handleRemovePromo = () => {
    removePromo()
    setPromoError('')
    setPromoInput('')
    showToast('Promo code removed.')
  }

  return (
    <aside
      className={`cart__summary ${className}`.trim()}
      aria-label={title}
    >
      <h2 className="cart__summary-title">{title}</h2>

      <div className="cart__shipping">
        <p className="cart__shipping-text">
          {amountToFreeShipping > 0
            ? `You're ${formatCurrency(
                amountToFreeShipping,
              )} away from free shipping.`
            : 'You have unlocked free shipping.'}
        </p>
        <div
          className="cart__progress"
          role="progressbar"
          aria-label="Progress toward free shipping"
          aria-valuemin={0}
          aria-valuemax={FREE_SHIPPING_THRESHOLD}
          aria-valuenow={Math.min(subtotal, FREE_SHIPPING_THRESHOLD)}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      {showPromoForm ? (
        promo ? (
          <div className="cart__promo-applied">
            <span className="cart__promo-icon" aria-hidden="true">
              <CheckIcon />
            </span>
            <span>
              <strong>{promo}</strong> applied
            </span>
            <button
              type="button"
              className="cart__promo-remove"
              onClick={handleRemovePromo}
            >
              Remove
            </button>
          </div>
        ) : (
          <form className="cart__promo" onSubmit={handleApplyPromo}>
            <label className="cart__promo-label" htmlFor="promo-code">
              Promo code
            </label>
            <div className="cart__promo-row">
              <input
                id="promo-code"
                className="cart__promo-input"
                type="text"
                value={promoInput}
                onChange={(event) => {
                  setPromoInput(event.target.value)
                  setPromoError('')
                }}
                placeholder="Enter code"
                autoComplete="off"
              />
              <button
                type="submit"
                className="btn btn--outline cart__promo-apply"
              >
                Apply
              </button>
            </div>
            {promoError ? (
              <p className="cart__promo-error" role="alert">
                {promoError}
              </p>
            ) : (
              <p className="cart__promo-hint">
                Try WARM20 for 20% off your order.
              </p>
            )}
          </form>
        )
      ) : (
        promo && (
          <div className="cart__promo-applied">
            <span className="cart__promo-icon" aria-hidden="true">
              <CheckIcon />
            </span>
            <span>
              <strong>{promo}</strong> applied
            </span>
          </div>
        )
      )}

      <dl className="cart__totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatCurrency(subtotal)}</dd>
        </div>
        {promo && (
          <div className="cart__discount-row">
            <dt>Discount ({promo})</dt>
            <dd>-{formatCurrency(discount)}</dd>
          </div>
        )}
        <div>
          <dt>Shipping</dt>
          <dd>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</dd>
        </div>
        <div className="cart__total-row">
          <dt>Total</dt>
          <dd>{formatCurrency(total)}</dd>
        </div>
      </dl>

      <p className="cart__note">{note}</p>

      {action}

      {showPerks && (
        <ul className="cart__perks">
          <li>
            <TruckIcon />
            Free shipping on orders over $75
          </li>
          <li>
            <ReturnIcon />
            Easy 30-day returns
          </li>
          <li>
            <ShieldIcon />
            Secure, encrypted checkout
          </li>
        </ul>
      )}
    </aside>
  )
}

export default OrderSummary
