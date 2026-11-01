import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import { formatAdminDate, AdminFeedback, AdminHeader, AdminLoading } from './AdminUI.jsx'

const blankCoupon = {
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  minSubtotal: '',
  maxDiscount: '',
  startsAt: '',
  expiresAt: '',
  usageLimit: '',
  perUserLimit: '',
  active: true,
}

function toDateInput(value) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

function CouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankCoupon)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/admin/coupons')
      setCoupons(data?.coupons ?? [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(blankCoupon)
    setEditorOpen(true)
    setError('')
    setNotice('')
  }

  const openEdit = (coupon) => {
    setEditing(coupon)
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: String(coupon.value),
      minSubtotal: String(coupon.minSubtotal ?? ''),
      maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : '',
      startsAt: toDateInput(coupon.startsAt),
      expiresAt: toDateInput(coupon.expiresAt),
      usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : '',
      perUserLimit:
        coupon.perUserLimit != null ? String(coupon.perUserLimit) : '',
      active: coupon.active,
    })
    setEditorOpen(true)
    setError('')
    setNotice('')
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditing(null)
    setForm(blankCoupon)
  }

  const handleChange = (field) => (event) => {
    const value =
      event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!form.code.trim()) {
      setError('Enter a promo code.')
      return
    }

    const body = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      type: form.type,
      value: Number(form.value),
      minSubtotal: form.minSubtotal === '' ? 0 : Number(form.minSubtotal),
      maxDiscount: form.maxDiscount === '' ? null : Number(form.maxDiscount),
      startsAt: form.startsAt ? new Date(`${form.startsAt}T00:00:00`).toISOString() : null,
      expiresAt: form.expiresAt
        ? new Date(`${form.expiresAt}T23:59:59`).toISOString()
        : null,
      usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
      perUserLimit: form.perUserLimit === '' ? null : Number(form.perUserLimit),
      active: form.active,
    }

    setSaving(true)
    try {
      if (editing) {
        await api.patch(`/admin/coupons/${editing._id}`, body)
        setNotice(`${body.code} updated.`)
      } else {
        await api.post('/admin/coupons', body)
        setNotice(`${body.code} created.`)
      }
      closeEditor()
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (coupon) => {
    setBusyId(coupon._id)
    setError('')
    setNotice('')
    try {
      await api.patch(`/admin/coupons/${coupon._id}`, {
        active: !coupon.active,
      })
      setNotice(`${coupon.code} is now ${coupon.active ? 'paused' : 'active'}.`)
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  const removeCoupon = async (coupon) => {
    if (!window.confirm(`Delete promo code ${coupon.code}?`)) return
    setBusyId(coupon._id)
    setError('')
    setNotice('')
    try {
      await api.delete(`/admin/coupons/${coupon._id}`)
      setNotice(`${coupon.code} deleted.`)
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
        eyebrow="Promotions"
        title="Promo codes"
        subtitle="Create offers, set limits, and pause campaigns any time."
        actions={
          <button className="btn btn--primary" type="button" onClick={openCreate}>
            New promo code
          </button>
        }
      />
      <AdminFeedback error={error} notice={notice} />

      {editorOpen && (
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>{editing ? 'Edit promo code' : 'New promo code'}</h2>
            <button type="button" className="admin-link-button" onClick={closeEditor}>
              Close
            </button>
          </div>
          <form className="admin-form" onSubmit={handleSave}>
            <label className="auth-field">
              <span>Code</span>
              <input
                value={form.code}
                onChange={handleChange('code')}
                placeholder="WARM20"
                required
              />
            </label>
            <label className="auth-field">
              <span>Type</span>
              <select value={form.type} onChange={handleChange('type')}>
                <option value="percentage">Percentage off</option>
                <option value="fixed">Fixed amount off</option>
              </select>
            </label>
            <label className="auth-field">
              <span>Value</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={handleChange('value')}
                required
              />
            </label>
            <label className="auth-field">
              <span>Minimum subtotal</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minSubtotal}
                onChange={handleChange('minSubtotal')}
              />
            </label>
            <label className="auth-field">
              <span>Maximum discount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.maxDiscount}
                onChange={handleChange('maxDiscount')}
                placeholder="No cap"
              />
            </label>
            <label className="auth-field">
              <span>Total uses allowed</span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.usageLimit}
                onChange={handleChange('usageLimit')}
                placeholder="Unlimited"
              />
            </label>
            <label className="auth-field">
              <span>Uses per customer</span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.perUserLimit}
                onChange={handleChange('perUserLimit')}
                placeholder="Unlimited"
              />
            </label>
            <label className="auth-field">
              <span>Starts</span>
              <input
                type="date"
                value={form.startsAt}
                onChange={handleChange('startsAt')}
              />
            </label>
            <label className="auth-field">
              <span>Expires</span>
              <input
                type="date"
                value={form.expiresAt}
                onChange={handleChange('expiresAt')}
              />
            </label>
            <label className="auth-field admin-form__wide">
              <span>Description</span>
              <input
                value={form.description}
                onChange={handleChange('description')}
                placeholder="Optional customer-facing description"
              />
            </label>
            <label className="checkbox-field admin-form__wide">
              <input
                type="checkbox"
                checked={form.active}
                onChange={handleChange('active')}
              />
              Active
            </label>
            <div className="admin-form__actions admin-form__wide">
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Create promo code'}
              </button>
              <button type="button" className="btn btn--outline" onClick={closeEditor}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="admin-panel admin-panel--flush">
        {loading ? (
          <AdminLoading label="Loading promo codes..." />
        ) : coupons.length === 0 ? (
          <p className="admin-empty">No promo codes yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Offer</th>
                  <th>Minimum</th>
                  <th>Used</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon._id}>
                    <td>
                      <strong className="admin-cell-title">{coupon.code}</strong>
                      <span className="admin-cell-sub">{coupon.description}</span>
                    </td>
                    <td>
                      {coupon.type === 'percentage'
                        ? `${coupon.value}% off`
                        : `${formatCurrency(coupon.value)} off`}
                    </td>
                    <td>
                      {coupon.minSubtotal
                        ? formatCurrency(coupon.minSubtotal)
                        : 'None'}
                    </td>
                    <td>
                      {coupon.usedCount}
                      {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                    </td>
                    <td>{coupon.expiresAt ? formatAdminDate(coupon.expiresAt) : 'Never'}</td>
                    <td>
                      <button
                        type="button"
                        className={`admin-toggle ${coupon.active ? 'is-on' : ''}`}
                        onClick={() => toggleActive(coupon)}
                        disabled={busyId === coupon._id}
                      >
                        <span />
                        {coupon.active ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="admin-link-button"
                          onClick={() => openEdit(coupon)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-link-button admin-link-button--danger"
                          onClick={() => removeCoupon(coupon)}
                          disabled={busyId === coupon._id}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

export default CouponsPage
