import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { api } from '../services/api.js'
import { formatCurrency } from '../utils/formatCurrency.js'
import './account.css'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'security', label: 'Security' },
]

const emptyAddress = {
  label: 'Home',
  firstName: '',
  lastName: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  region: '',
  postalCode: '',
  country: 'United States',
  isDefault: false,
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function StatusPill({ status }) {
  return (
    <span className={`status-pill status-pill--${String(status).toLowerCase()}`}>
      {status}
    </span>
  )
}

function OverviewTab({ orders, addresses, wishlist, onSelectTab }) {
  const { user } = useAuth()
  const recentOrder = orders[0]
  const defaultAddress = addresses.find((address) => address.isDefault)

  return (
    <div className="account-overview">
      <div className="account-hero">
        <div>
          <span className="eyebrow">Your account</span>
          <h2>Welcome back, {user?.name?.split(' ')[0] || 'friend'}.</h2>
          <p>
            Your orders, saved details, and wishlist are all in one calm place.
          </p>
        </div>
        <Link className="btn btn--outline" to="/shop">
          Continue shopping
        </Link>
      </div>

      <div className="account-stats">
        <button type="button" className="account-stat" onClick={() => onSelectTab('orders')}>
          <span>Orders</span>
          <strong>{orders.length}</strong>
        </button>
        <button
          type="button"
          className="account-stat"
          onClick={() => onSelectTab('addresses')}
        >
          <span>Saved addresses</span>
          <strong>{addresses.length}</strong>
        </button>
        <button
          type="button"
          className="account-stat"
          onClick={() => onSelectTab('wishlist')}
        >
          <span>Wishlist</span>
          <strong>{wishlist.length}</strong>
        </button>
      </div>

      <div className="account-overview__grid">
        <section className="account-panel">
          <div className="account-panel__head">
            <h3>Latest order</h3>
            <button type="button" className="link-button" onClick={() => onSelectTab('orders')}>
              View all
            </button>
          </div>
          {recentOrder ? (
            <div className="account-order-preview">
              <div className="account-order-preview__top">
                <div>
                  <span>{recentOrder.id}</span>
                  <strong>{formatCurrency(recentOrder.total)}</strong>
                </div>
                <StatusPill status={recentOrder.status} />
              </div>
              <p>
                {recentOrder.items.length} item
                {recentOrder.items.length === 1 ? '' : 's'} ·{' '}
                {formatDate(recentOrder.createdAt)}
              </p>
              <Link className="text-link" to={`/order-confirmation/${recentOrder.id}`}>
                View order
              </Link>
            </div>
          ) : (
            <p className="account-empty">
              No orders yet. Your first Cartify find is waiting.
            </p>
          )}
        </section>

        <section className="account-panel">
          <div className="account-panel__head">
            <h3>Default address</h3>
            <button
              type="button"
              className="link-button"
              onClick={() => onSelectTab('addresses')}
            >
              Manage
            </button>
          </div>
          {defaultAddress ? (
            <address className="account-address-preview">
              <strong>
                {defaultAddress.firstName} {defaultAddress.lastName}
              </strong>
              <span>{defaultAddress.address1}</span>
              {defaultAddress.address2 && <span>{defaultAddress.address2}</span>}
              <span>
                {defaultAddress.city}, {defaultAddress.region}{' '}
                {defaultAddress.postalCode}
              </span>
              <span>{defaultAddress.country}</span>
            </address>
          ) : (
            <p className="account-empty">No saved address yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function OrdersTab({ orders, loading, onCancel }) {
  if (loading) return <p className="account-empty">Loading orders...</p>

  if (orders.length === 0) {
    return (
      <div className="account-empty-card">
        <h3>No orders yet</h3>
        <p>When you place an order, it will appear here with live status.</p>
        <Link className="btn btn--primary" to="/shop">
          Browse the shop
        </Link>
      </div>
    )
  }

  return (
    <div className="account-orders">
      {orders.map((order) => (
        <article className="account-order" key={order.id}>
          <header className="account-order__head">
            <div>
              <span>{order.id}</span>
              <p>Placed {formatDate(order.createdAt)}</p>
            </div>
            <div className="account-order__status">
              <StatusPill status={order.status} />
              <strong>{formatCurrency(order.total)}</strong>
            </div>
          </header>

          <div className="account-order__items">
            {order.items.map((item) => (
              <div className="account-order__item" key={`${order.id}-${item.productId}`}>
                <img src={item.image} alt="" />
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.quantity} × {formatCurrency(item.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <footer className="account-order__foot">
            <span>
              {order.delivery?.label || 'Standard delivery'} ·{' '}
              {order.shipping === 0
                ? 'Free shipping'
                : formatCurrency(order.shipping)}
            </span>
            <div className="account-order__actions">
              <Link className="text-link" to={`/order-confirmation/${order.id}`}>
                Order details
              </Link>
              {['Confirmed', 'Processing'].includes(order.status) && (
                <button
                  type="button"
                  className="link-button link-button--danger"
                  onClick={() => onCancel(order)}
                >
                  Cancel order
                </button>
              )}
            </div>
          </footer>
        </article>
      ))}
    </div>
  )
}

function AddressesTab({ addresses, loading, onRefresh }) {
  const [form, setForm] = useState(emptyAddress)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  const startEdit = (address) => {
    setEditingId(address.id)
    setForm({
      label: address.label || 'Home',
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone || '',
      address1: address.address1,
      address2: address.address2 || '',
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    })
    setError('')
    setNotice('')
  }

  const resetForm = () => {
    setForm(emptyAddress)
    setEditingId(null)
    setError('')
  }

  const handleChange = (field) => (event) => {
    const value =
      event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)

    try {
      if (editingId) {
        await api.patch(`/addresses/${editingId}`, form)
        setNotice('Address updated.')
      } else {
        await api.post('/addresses', form)
        setNotice('Address saved.')
      }
      resetForm()
      await onRefresh()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (address) => {
    if (!window.confirm(`Remove the ${address.label || 'saved'} address?`)) return
    try {
      await api.delete(`/addresses/${address.id}`)
      if (editingId === address.id) resetForm()
      await onRefresh()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleDefault = async (address) => {
    try {
      await api.post(`/addresses/${address.id}/default`)
      await onRefresh()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="account-addresses">
      <div className="account-panel">
        <div className="account-panel__head">
          <h3>Saved addresses</h3>
          <span className="account-panel__count">{addresses.length}</span>
        </div>

        {loading ? (
          <p className="account-empty">Loading addresses...</p>
        ) : addresses.length === 0 ? (
          <p className="account-empty">
            No saved addresses yet. Add one below for faster checkout.
          </p>
        ) : (
          <div className="address-grid">
            {addresses.map((address) => (
              <article className="address-card" key={address.id}>
                <div className="address-card__top">
                  <strong>{address.label || 'Address'}</strong>
                  {address.isDefault && <span className="badge">Default</span>}
                </div>
                <address>
                  {address.firstName} {address.lastName}
                  <br />
                  {address.address1}
                  {address.address2 && (
                    <>
                      <br />
                      {address.address2}
                    </>
                  )}
                  <br />
                  {address.city}, {address.region} {address.postalCode}
                  <br />
                  {address.country}
                  {address.phone && (
                    <>
                      <br />
                      {address.phone}
                    </>
                  )}
                </address>
                <div className="address-card__actions">
                  <button type="button" className="link-button" onClick={() => startEdit(address)}>
                    Edit
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleDefault(address)}
                    >
                      Make default
                    </button>
                  )}
                  <button
                    type="button"
                    className="link-button link-button--danger"
                    onClick={() => handleDelete(address)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="account-panel">
        <div className="account-panel__head">
          <h3>{editingId ? 'Edit address' : 'Add an address'}</h3>
          {editingId && (
            <button type="button" className="link-button" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>

        {error && <div className="auth-error">{error}</div>}
        {notice && <p className="auth-notice">{notice}</p>}

        <form className="address-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Label</span>
            <input value={form.label} onChange={handleChange('label')} />
          </label>
          <label className="auth-field">
            <span>First name</span>
            <input
              value={form.firstName}
              onChange={handleChange('firstName')}
              required
            />
          </label>
          <label className="auth-field">
            <span>Last name</span>
            <input
              value={form.lastName}
              onChange={handleChange('lastName')}
              required
            />
          </label>
          <label className="auth-field">
            <span>Phone</span>
            <input value={form.phone} onChange={handleChange('phone')} />
          </label>
          <label className="auth-field address-form__wide">
            <span>Street address</span>
            <input
              value={form.address1}
              onChange={handleChange('address1')}
              required
            />
          </label>
          <label className="auth-field address-form__wide">
            <span>Apartment, suite, etc.</span>
            <input value={form.address2} onChange={handleChange('address2')} />
          </label>
          <label className="auth-field">
            <span>City</span>
            <input value={form.city} onChange={handleChange('city')} required />
          </label>
          <label className="auth-field">
            <span>State / region</span>
            <input
              value={form.region}
              onChange={handleChange('region')}
              required
            />
          </label>
          <label className="auth-field">
            <span>Postal code</span>
            <input
              value={form.postalCode}
              onChange={handleChange('postalCode')}
              required
            />
          </label>
          <label className="auth-field">
            <span>Country</span>
            <input
              value={form.country}
              onChange={handleChange('country')}
              required
            />
          </label>
          <label className="checkbox-field address-form__wide">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={handleChange('isDefault')}
            />
            Use as my default address
          </label>
          <div className="address-form__actions">
            <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Save address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function WishlistTab({ items, loading, onRemove, onRefresh }) {
  const { addItem } = useCart()
  const [notice, setNotice] = useState('')

  if (loading) return <p className="account-empty">Loading wishlist...</p>

  if (items.length === 0) {
    return (
      <div className="account-empty-card">
        <h3>Your wishlist is empty</h3>
        <p>Tap the heart on a product to keep it here for later.</p>
        <Link className="btn btn--primary" to="/shop">
          Discover products
        </Link>
      </div>
    )
  }

  return (
    <div>
      {notice && <p className="auth-notice">{notice}</p>}
      <div className="wishlist-grid">
        {items.map((product) => (
          <article className="wishlist-card" key={product.id}>
            <Link to={`/product/${product.slug || product.id}`}>
              <img src={product.image} alt={product.name} />
            </Link>
            <div className="wishlist-card__body">
              <span>{product.brand}</span>
              <Link to={`/product/${product.slug || product.id}`}>
                <strong>{product.name}</strong>
              </Link>
              <p>{formatCurrency(product.price)}</p>
              <div className="wishlist-card__actions">
                <button
                  type="button"
                  className="btn btn--primary btn--small"
                  onClick={async () => {
                    addItem(product)
                    setNotice(`${product.name} added to your bag.`)
                    await api.delete(`/wishlist/${product.id}`)
                    await onRefresh()
                  }}
                >
                  Add to bag
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => onRemove(product)}
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function SecurityTab() {
  const {
    user,
    updateProfile,
    changePassword,
    requestTwoFactorEnable,
    confirmTwoFactorEnable,
    requestTwoFactorDisable,
    confirmTwoFactorDisable,
  } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [profileNotice, setProfileNotice] = useState('')
  const [profileError, setProfileError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordNotice, setPasswordNotice] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [twoFactor, setTwoFactor] = useState({
    mode: null,
    password: '',
    challengeId: '',
    code: '',
    error: '',
    notice: '',
    busy: false,
  })

  const handleProfile = async (event) => {
    event.preventDefault()
    setProfileError('')
    setProfileNotice('')
    setSavingProfile(true)
    try {
      await updateProfile({ name: name.trim() })
      setProfileNotice('Profile updated.')
    } catch (requestError) {
      setProfileError(requestError.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePassword = async (event) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordNotice('')

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('Those new passwords do not match.')
      return
    }

    setSavingPassword(true)
    try {
      await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setPasswordNotice('Password changed. Other devices were signed out.')
    } catch (requestError) {
      setPasswordError(requestError.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const startTwoFactor = (mode) => {
    setTwoFactor({
      mode,
      password: '',
      challengeId: '',
      code: '',
      error: '',
      notice: '',
      busy: false,
    })
  }

  const requestTwoFactor = async (event) => {
    event.preventDefault()
    setTwoFactor((current) => ({ ...current, error: '', busy: true }))
    try {
      const data =
        twoFactor.mode === 'enable'
          ? await requestTwoFactorEnable(twoFactor.password)
          : await requestTwoFactorDisable(twoFactor.password)
      setTwoFactor((current) => ({
        ...current,
        challengeId: data.challengeId,
        notice: 'Code sent. Check your inbox.',
        busy: false,
      }))
    } catch (requestError) {
      setTwoFactor((current) => ({
        ...current,
        error: requestError.message,
        busy: false,
      }))
    }
  }

  const confirmTwoFactor = async (event) => {
    event.preventDefault()
    setTwoFactor((current) => ({ ...current, error: '', busy: true }))
    try {
      if (twoFactor.mode === 'enable') {
        await confirmTwoFactorEnable({
          code: twoFactor.code,
          challengeId: twoFactor.challengeId,
        })
      } else {
        await confirmTwoFactorDisable({
          code: twoFactor.code,
          challengeId: twoFactor.challengeId,
        })
      }
      setTwoFactor({
        mode: null,
        password: '',
        challengeId: '',
        code: '',
        error: '',
        notice: '',
        busy: false,
      })
    } catch (requestError) {
      setTwoFactor((current) => ({
        ...current,
        error: requestError.message,
        busy: false,
      }))
    }
  }

  return (
    <div className="account-security">
      <section className="account-panel">
        <div className="account-panel__head">
          <h3>Profile</h3>
        </div>
        {profileError && <div className="auth-error">{profileError}</div>}
        {profileNotice && <p className="auth-notice">{profileNotice}</p>}
        <form className="security-form" onSubmit={handleProfile}>
          <label className="auth-field">
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label className="auth-field">
            <span>Email</span>
            <input value={user?.email || ''} disabled />
          </label>
          <button className="btn btn--primary" type="submit" disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </section>

      <section className="account-panel">
        <div className="account-panel__head">
          <h3>Password</h3>
        </div>
        {passwordError && <div className="auth-error">{passwordError}</div>}
        {passwordNotice && <p className="auth-notice">{passwordNotice}</p>}
        <form className="security-form" onSubmit={handlePassword}>
          <label className="auth-field">
            <span>Current password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={passwords.currentPassword}
              onChange={(event) =>
                setPasswords((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
              }
              required
            />
          </label>
          <label className="auth-field">
            <span>New password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={passwords.newPassword}
              onChange={(event) =>
                setPasswords((current) => ({
                  ...current,
                  newPassword: event.target.value,
                }))
              }
              required
            />
          </label>
          <label className="auth-field">
            <span>Confirm new password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={passwords.confirmPassword}
              onChange={(event) =>
                setPasswords((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))
              }
              required
            />
          </label>
          <button className="btn btn--primary" type="submit" disabled={savingPassword}>
            {savingPassword ? 'Updating...' : 'Change password'}
          </button>
        </form>
      </section>

      <section className="account-panel">
        <div className="account-panel__head">
          <h3>Two-factor authentication</h3>
          <span className={`status-pill ${user?.twoFactorEnabled ? 'status-pill--delivered' : ''}`}>
            {user?.twoFactorEnabled ? 'Enabled' : 'Optional'}
          </span>
        </div>
        <p className="account-panel__copy">
          {user?.twoFactorEnabled
            ? 'Each sign-in asks for a 6-digit code sent to your email.'
            : 'Add an email code at sign-in for an extra layer of protection.'}
        </p>

        {twoFactor.error && <div className="auth-error">{twoFactor.error}</div>}
        {twoFactor.notice && <p className="auth-notice">{twoFactor.notice}</p>}

        {!twoFactor.mode ? (
          <button
            className="btn btn--outline"
            type="button"
            onClick={() => startTwoFactor(user?.twoFactorEnabled ? 'disable' : 'enable')}
          >
            {user?.twoFactorEnabled
              ? 'Turn off two-factor authentication'
              : 'Turn on two-factor authentication'}
          </button>
        ) : (
          <form
            className="security-form security-form--inline"
            onSubmit={twoFactor.challengeId ? confirmTwoFactor : requestTwoFactor}
          >
            {!twoFactor.challengeId ? (
              <label className="auth-field">
                <span>Confirm your password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={twoFactor.password}
                  onChange={(event) =>
                    setTwoFactor((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  required
                />
              </label>
            ) : (
              <label className="auth-field">
                <span>6-digit code</span>
                <input
                  className="auth-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={twoFactor.code}
                  onChange={(event) =>
                    setTwoFactor((current) => ({
                      ...current,
                      code: event.target.value.replace(/\D/g, '').slice(0, 6),
                    }))
                  }
                  required
                />
              </label>
            )}
            <div className="security-form__actions">
              <button className="btn btn--primary" type="submit" disabled={twoFactor.busy}>
                {twoFactor.busy
                  ? 'Please wait...'
                  : twoFactor.challengeId
                    ? 'Confirm code'
                    : 'Send code'}
              </button>
              <button
                className="link-button"
                type="button"
                onClick={() => startTwoFactor(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

function AccountPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const tabParam = searchParams.get('tab')
  const tab = tabs.some((entry) => entry.id === tabParam) ? tabParam : 'overview'

  const loadOrders = useCallback(async () => {
    const data = await api.get('/orders?limit=50')
    setOrders(data?.orders ?? [])
  }, [])

  const loadAddresses = useCallback(async () => {
    const data = await api.get('/addresses')
    setAddresses(data?.addresses ?? [])
  }, [])

  const loadWishlist = useCallback(async () => {
    const data = await api.get('/wishlist')
    setWishlist(data?.items ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    Promise.all([loadOrders(), loadAddresses(), loadWishlist()])
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [loadOrders, loadAddresses, loadWishlist])

  const handleCancel = useCallback(async (order) => {
    if (!window.confirm(`Cancel order ${order.id}?`)) return
    setError('')
    setNotice('')
    try {
      const data = await api.post(`/orders/${order.id}/cancel`)
      setOrders((current) =>
        current.map((entry) =>
          entry.id === data.order.id ? data.order : entry,
        ),
      )
      setNotice('Your order has been cancelled.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [])

  const handleRemoveWishlist = useCallback(async (product) => {
    try {
      await api.delete(`/wishlist/${product.id}`)
      await loadWishlist()
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [loadWishlist])

  const selectTab = (nextTab) => {
    setSearchParams(nextTab === 'overview' ? {} : { tab: nextTab })
    setError('')
    setNotice('')
  }

  const initials = useMemo(
    () =>
      (user?.name || 'C')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    [user?.name],
  )

  return (
    <section className="section account-page">
      <div className="container">
        <header className="account-header">
          <div className="account-header__identity">
            <span className="account-avatar" aria-hidden="true">
              {initials}
            </span>
            <div>
              <span className="eyebrow">Account</span>
              <h1>{user?.name}</h1>
              <p>
                {user?.email}
                {user?.twoFactorEnabled && ' · 2FA on'}
              </p>
            </div>
          </div>
          {user?.role === 'admin' && (
            <Link className="btn btn--outline" to="/admin">
              Open admin
            </Link>
          )}
        </header>

        <div className="account-layout">
          <nav className="account-nav" aria-label="Account sections">
            {tabs.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={tab === entry.id ? 'is-active' : ''}
                onClick={() => selectTab(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </nav>

          <div className="account-content">
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}
            {notice && <p className="auth-notice">{notice}</p>}

            {tab === 'overview' && (
              <OverviewTab
                orders={orders}
                addresses={addresses}
                wishlist={wishlist}
                onSelectTab={selectTab}
              />
            )}
            {tab === 'orders' && (
              <OrdersTab
                orders={orders}
                loading={loading}
                onCancel={handleCancel}
              />
            )}
            {tab === 'addresses' && (
              <AddressesTab
                addresses={addresses}
                loading={loading}
                onRefresh={loadAddresses}
              />
            )}
            {tab === 'wishlist' && (
              <WishlistTab
                items={wishlist}
                loading={loading}
                onRemove={handleRemoveWishlist}
                onRefresh={loadWishlist}
              />
            )}
            {tab === 'security' && <SecurityTab />}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AccountPage
