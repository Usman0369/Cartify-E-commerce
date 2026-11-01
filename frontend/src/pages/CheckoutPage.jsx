import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRightIcon,
  CheckIcon,
  ShieldIcon,
} from '../components/Icons.jsx'
import OrderSummary from '../components/OrderSummary.jsx'
import { useCart } from '../context/CartContext.jsx'
import {
  DELIVERY_METHODS,
  getDeliveryMethod,
  getDeliveryShipping,
} from '../data/delivery.js'
import { api, apiEnabled } from '../services/api.js'
import { createOrder, saveOrder } from '../services/orders.js'
import {
  CHECKOUT_FIELD_ORDER,
  validateCheckout,
} from '../utils/checkoutValidation.js'
import { formatCurrency } from '../utils/formatCurrency.js'
import { roundMoney } from '../utils/money.js'
import {
  getCardBrand,
  getCardLast4,
} from '../utils/payment.js'
import './CheckoutPage.css'

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  region: '',
  postalCode: '',
  country: 'United States',
  deliveryMethod: 'standard',
  cardName: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
}

const countries = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'India',
  'Pakistan',
]

function Field({ id, label, error, hint, children }) {
  return (
    <div className={`checkout-field${error ? ' checkout-field--error' : ''}`}>
      <label className="checkout-field__label" htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="checkout-field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="checkout-field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function CheckoutPage() {
  const {
    cartItems,
    subtotal,
    discount,
    shipping: cartShipping,
    promo,
    clearCart,
  } = useCart()
  const navigate = useNavigate()
  const placedRef = useRef(false)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const deliveryMethod = getDeliveryMethod(form.deliveryMethod)
  const shipping = getDeliveryShipping(deliveryMethod.id, cartShipping)
  const total = Math.max(0, roundMoney(subtotal - discount + shipping))

  const handleFieldChange = (name) => (event) => {
    const { value } = event.target

    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  const fieldProps = (name) => ({
    id: name,
    name,
    value: form[name],
    onChange: handleFieldChange(name),
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')

    const nextErrors = validateCheckout(form)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      const firstField = CHECKOUT_FIELD_ORDER.find(
        (field) => nextErrors[field],
      )
      const target = firstField
        ? document.getElementById(firstField)
        : null
      if (target) target.focus()
      return
    }

    const contact = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    }
    const shippingAddress = {
      address1: form.address1.trim(),
      address2: form.address2.trim(),
      city: form.city.trim(),
      region: form.region.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country,
    }

    const items = cartItems.map(({ product, quantity, lineTotal }) => ({
      productId: product.id,
      slug: product.slug ?? product.id,
      name: product.name,
      brand: product.brand,
      image: product.image,
      price: product.price,
      quantity,
      lineTotal,
    }))

    let order

    if (apiEnabled) {
      setSubmitting(true)
      try {
        const data = await api.post('/orders', {
          contact,
          shippingAddress,
          deliveryMethod: deliveryMethod.id,
          promo: promo ?? '',
          payment: {
            cardholder: form.cardName.trim(),
            cardNumber: form.cardNumber,
            expiry: form.expiry.trim(),
            cvc: form.cvc.trim(),
          },
          items: cartItems.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        })
        order = data.order
        saveOrder(order, { guestAccessToken: data.guestAccessToken })
      } catch (requestError) {
        setSubmitError(requestError.message)
        setSubmitting(false)
        return
      }
      setSubmitting(false)
    } else {
      order = createOrder({
        contact,
        shippingAddress,
        delivery: {
          id: deliveryMethod.id,
          label: deliveryMethod.label,
          description: deliveryMethod.description,
          shipping,
        },
        payment: {
          brand: getCardBrand(form.cardNumber),
          last4: getCardLast4(form.cardNumber),
        },
        items,
        promo: promo ?? null,
        subtotal,
        discount,
        shipping,
        total,
        currency: 'USD',
      })
    }

    placedRef.current = true
    clearCart()
    navigate(`/order-confirmation/${order.id}`, { replace: true })
  }

  if (cartItems.length === 0 && !placedRef.current) {
    return <Navigate to="/cart" replace />
  }

  return (
    <section className="section checkout">
      <div className="container">
        <div className="checkout__head">
          <span className="eyebrow">Secure checkout</span>
          <h1 className="checkout__title">Checkout</h1>
          <p className="checkout__intro">
            Add your contact and delivery details, choose how you would like
            your order to arrive, and review the final total.
          </p>
        </div>

        <div className="checkout__layout">
          <form
            id="checkout-form"
            className="checkout__form"
            onSubmit={handleSubmit}
            noValidate
          >
            <section
              className="checkout__panel"
              aria-labelledby="contact-title"
            >
              <div className="checkout__panel-head">
                <span className="checkout__step">1</span>
                <div>
                  <h2 className="checkout__panel-title" id="contact-title">
                    Contact details
                  </h2>
                  <p className="checkout__panel-copy">
                    We will use these details for your order updates.
                  </p>
                </div>
              </div>

              <div className="checkout__grid">
                <Field
                  id="firstName"
                  label="First name"
                  error={errors.firstName}
                >
                  <input
                    className="checkout-input"
                    type="text"
                    autoComplete="given-name"
                    {...fieldProps('firstName')}
                  />
                </Field>

                <Field
                  id="lastName"
                  label="Last name"
                  error={errors.lastName}
                >
                  <input
                    className="checkout-input"
                    type="text"
                    autoComplete="family-name"
                    {...fieldProps('lastName')}
                  />
                </Field>

                <Field
                  id="email"
                  label="Email address"
                  error={errors.email}
                >
                  <input
                    className="checkout-input"
                    type="email"
                    autoComplete="email"
                    {...fieldProps('email')}
                  />
                </Field>

                <Field
                  id="phone"
                  label="Phone number"
                  error={errors.phone}
                >
                  <input
                    className="checkout-input"
                    type="tel"
                    autoComplete="tel"
                    {...fieldProps('phone')}
                  />
                </Field>
              </div>
            </section>

            <section
              className="checkout__panel"
              aria-labelledby="shipping-title"
            >
              <div className="checkout__panel-head">
                <span className="checkout__step">2</span>
                <div>
                  <h2 className="checkout__panel-title" id="shipping-title">
                    Shipping address
                  </h2>
                  <p className="checkout__panel-copy">
                    Where should we send your order?
                  </p>
                </div>
              </div>

              <div className="checkout__grid">
                <Field
                  id="address1"
                  label="Address line 1"
                  error={errors.address1}
                >
                  <input
                    className="checkout-input"
                    type="text"
                    autoComplete="address-line1"
                    {...fieldProps('address1')}
                  />
                </Field>

                <Field
                  id="address2"
                  label="Address line 2 (optional)"
                  error={errors.address2}
                >
                  <input
                    className="checkout-input"
                    type="text"
                    autoComplete="address-line2"
                    {...fieldProps('address2')}
                  />
                </Field>

                <Field id="city" label="City" error={errors.city}>
                  <input
                    className="checkout-input"
                    type="text"
                    autoComplete="address-level2"
                    {...fieldProps('city')}
                  />
                </Field>

                <Field
                  id="region"
                  label="State or region"
                  error={errors.region}
                >
                  <input
                    className="checkout-input"
                    type="text"
                    autoComplete="address-level1"
                    {...fieldProps('region')}
                  />
                </Field>

                <Field
                  id="postalCode"
                  label="Postal code"
                  error={errors.postalCode}
                >
                  <input
                    className="checkout-input"
                    type="text"
                    autoComplete="postal-code"
                    {...fieldProps('postalCode')}
                  />
                </Field>

                <Field
                  id="country"
                  label="Country"
                  error={errors.country}
                >
                  <select
                    className="checkout-input"
                    autoComplete="country-name"
                    {...fieldProps('country')}
                  >
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            <section
              className="checkout__panel"
              aria-labelledby="delivery-title"
            >
              <div className="checkout__panel-head">
                <span className="checkout__step">3</span>
                <div>
                  <h2 className="checkout__panel-title" id="delivery-title">
                    Delivery method
                  </h2>
                  <p className="checkout__panel-copy">
                    Choose the pace that works for you.
                  </p>
                </div>
              </div>

              <fieldset className="checkout__fieldset">
                <legend className="sr-only">Delivery method</legend>
                <div className="checkout__delivery-options">
                  {DELIVERY_METHODS.map((method) => {
                    const price = getDeliveryShipping(
                      method.id,
                      cartShipping,
                    )

                    return (
                      <label
                        className={`checkout-delivery${
                          form.deliveryMethod === method.id
                            ? ' checkout-delivery--active'
                            : ''
                        }`}
                        key={method.id}
                      >
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value={method.id}
                          checked={form.deliveryMethod === method.id}
                          onChange={handleFieldChange('deliveryMethod')}
                        />
                        <span className="checkout-delivery__body">
                          <span className="checkout-delivery__name">
                            {method.label}
                          </span>
                          <span className="checkout-delivery__meta">
                            {method.description}
                          </span>
                        </span>
                        <span className="checkout-delivery__price">
                          {price === 0 ? 'Free' : formatCurrency(price)}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            </section>

            <section
              className="checkout__panel checkout__panel--payment"
              aria-labelledby="payment-title"
            >
              <div className="checkout__panel-head">
                <span className="checkout__step">4</span>
                <div>
                  <h2 className="checkout__panel-title" id="payment-title">
                    Demo payment
                  </h2>
                  <p className="checkout__panel-copy">
                    Payment fields are for demonstration only.
                  </p>
                </div>
                <span className="checkout__demo-badge">
                  <CheckIcon />
                  Test mode
                </span>
              </div>

              <div className="checkout__demo-note" role="note">
                <ShieldIcon />
                <p>
                  <strong>Do not enter real card details.</strong> This is a
                  demo checkout. No payment will be processed, and full card
                  numbers and security codes are never stored.
                </p>
              </div>

              <div className="checkout__grid">
                <div className="checkout__full">
                  <Field
                    id="cardName"
                    label="Cardholder name"
                    error={errors.cardName}
                  >
                    <input
                      className="checkout-input"
                      type="text"
                      autoComplete="off"
                      {...fieldProps('cardName')}
                    />
                  </Field>
                </div>

                <div className="checkout__full">
                  <Field
                    id="cardNumber"
                    label="Card number"
                    error={errors.cardNumber}
                    hint="Demo cards such as 4242 4242 4242 4242 work."
                  >
                    <input
                      className="checkout-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={23}
                      placeholder="4242 4242 4242 4242"
                      autoComplete="off"
                      {...fieldProps('cardNumber')}
                    />
                  </Field>
                </div>

                <Field
                  id="expiry"
                  label="Expiry date (MM/YY)"
                  error={errors.expiry}
                >
                  <input
                    className="checkout-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    placeholder="MM/YY"
                    autoComplete="off"
                    {...fieldProps('expiry')}
                  />
                </Field>

                <Field
                  id="cvc"
                  label="Security code (CVC)"
                  error={errors.cvc}
                  hint="3 or 4 digits."
                >
                  <input
                    className="checkout-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="123"
                    autoComplete="off"
                    {...fieldProps('cvc')}
                  />
                </Field>
              </div>
            </section>

            {submitError && (
              <div className="checkout__error" role="alert">
                {submitError}
              </div>
            )}

            <div className="checkout__submit-row">
              <div>
                <p className="checkout__submit-label">Order total</p>
                <p className="checkout__submit-total">
                  {formatCurrency(total)}
                </p>
              </div>
              <button
                type="submit"
                className="btn btn--primary checkout__submit"
                disabled={submitting}
              >
                {submitting ? 'Placing order...' : 'Place order'}
                <ArrowRightIcon />
              </button>
            </div>

            <p className="checkout__fine-print">
              By placing this demo order you confirm the details above are
              correct. This store is a front-end demonstration only.
            </p>
          </form>

          <OrderSummary
            shipping={shipping}
            showPromoForm
            note="Demo checkout - no payment will be processed."
            action={
              <Link className="cart__continue" to="/cart">
                Back to cart
              </Link>
            }
          />
        </div>
      </div>
    </section>
  )
}

export default CheckoutPage
