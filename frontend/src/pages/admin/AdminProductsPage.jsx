import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { formatCurrency } from '../../utils/formatCurrency.js'
import {
  AdminFeedback,
  AdminHeader,
  AdminLoading,
  AdminPagination,
} from './AdminUI.jsx'

const blankProduct = {
  name: '',
  brand: '',
  categoryId: '',
  price: '',
  compareAt: '',
  stock: '',
  image: '',
  description: '',
  badge: '',
  featured: false,
  bestSeller: false,
  active: true,
}

function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankProduct)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status) params.set('status', status)
      if (search) params.set('search', search)
      const [productData, categoryData] = await Promise.all([
        api.get(`/admin/products?${params.toString()}`),
        api.get('/admin/categories'),
      ])
      setProducts(productData?.products ?? [])
      setPagination(productData?.pagination ?? null)
      setCategories(categoryData?.categories ?? [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [page, status, search])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...blankProduct,
      categoryId: categories[0]?.id || '',
    })
    setEditorOpen(true)
    setError('')
    setNotice('')
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      name: product.name,
      brand: product.brand,
      categoryId: product.categoryId || '',
      price: String(product.price),
      compareAt: product.compareAt ? String(product.compareAt) : '',
      stock: String(product.stock),
      image: product.image || '',
      description: product.description || '',
      badge: product.badge || '',
      featured: Boolean(product.featured),
      bestSeller: Boolean(product.bestSeller),
      active: Boolean(product.active),
    })
    setEditorOpen(true)
    setError('')
    setNotice('')
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditing(null)
    setForm(blankProduct)
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

    if (!form.categoryId) {
      setError('Choose a category.')
      return
    }
    if (form.description.trim().length < 10) {
      setError('Write at least 10 characters of description.')
      return
    }

    const body = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      categoryId: form.categoryId,
      price: Number(form.price),
      compareAt: form.compareAt === '' ? null : Number(form.compareAt),
      stock: Number(form.stock),
      image: form.image.trim(),
      description: form.description.trim(),
      badge: form.badge.trim() || null,
      featured: form.featured,
      bestSeller: form.bestSeller,
      active: form.active,
    }

    setSaving(true)
    try {
      if (editing) {
        await api.patch(`/admin/products/${editing._id}`, body)
        setNotice(`${body.name} updated.`)
      } else {
        await api.post('/admin/products', body)
        setNotice(`${body.name} created.`)
      }
      closeEditor()
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (product) => {
    if (!window.confirm(`Archive ${product.name}? It will be hidden from the shop.`)) {
      return
    }
    setBusyId(product._id)
    setError('')
    setNotice('')
    try {
      await api.delete(`/admin/products/${product._id}`)
      setNotice(`${product.name} archived.`)
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  const toggleActive = async (product) => {
    setBusyId(product._id)
    setError('')
    setNotice('')
    try {
      const data = await api.patch(`/admin/products/${product._id}`, {
        active: !product.active,
      })
      setProducts((current) =>
        current.map((entry) =>
          entry._id === data.product._id ? data.product : entry,
        ),
      )
      setNotice(
        `${data.product.name} is now ${data.product.active ? 'active' : 'inactive'}.`,
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AdminHeader
        eyebrow="Catalog"
        title="Products"
        subtitle="Keep prices, stock, and storefront visibility accurate."
        actions={
          <button className="btn btn--primary" type="button" onClick={openCreate}>
            Add product
          </button>
        }
      />
      <AdminFeedback error={error} notice={notice} />

      {editorOpen && (
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>{editing ? 'Edit product' : 'New product'}</h2>
            <button type="button" className="admin-link-button" onClick={closeEditor}>
              Close
            </button>
          </div>
          <form className="admin-form" onSubmit={handleSave}>
            <label className="auth-field">
              <span>Name</span>
              <input value={form.name} onChange={handleChange('name')} required />
            </label>
            <label className="auth-field">
              <span>Brand</span>
              <input value={form.brand} onChange={handleChange('brand')} required />
            </label>
            <label className="auth-field">
              <span>Category</span>
              <select
                value={form.categoryId}
                onChange={handleChange('categoryId')}
                required
              >
                <option value="">Choose a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="auth-field">
              <span>Badge</span>
              <input
                value={form.badge}
                onChange={handleChange('badge')}
                placeholder="Optional"
              />
            </label>
            <label className="auth-field">
              <span>Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange('price')}
                required
              />
            </label>
            <label className="auth-field">
              <span>Compare at</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.compareAt}
                onChange={handleChange('compareAt')}
                placeholder="Optional"
              />
            </label>
            <label className="auth-field">
              <span>Stock</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={handleChange('stock')}
                required
              />
            </label>
            <label className="auth-field">
              <span>Image URL</span>
              <input value={form.image} onChange={handleChange('image')} />
            </label>
            <label className="auth-field admin-form__wide">
              <span>Description</span>
              <textarea
                rows="4"
                value={form.description}
                onChange={handleChange('description')}
                required
              />
            </label>
            <div className="admin-checks admin-form__wide">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={handleChange('featured')}
                />
                Featured
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.bestSeller}
                  onChange={handleChange('bestSeller')}
                />
                Best seller
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={handleChange('active')}
                />
                Active in shop
              </label>
            </div>
            <div className="admin-form__actions admin-form__wide">
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Create product'}
              </button>
              <button type="button" className="btn btn--outline" onClick={closeEditor}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

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
            placeholder="Search products or brands"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search products"
          />
          <button className="btn btn--primary btn--small" type="submit">
            Search
          </button>
        </form>

        <label className="admin-filter">
          <span>View</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="">All products</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="low-stock">Low stock</option>
          </select>
        </label>
      </div>

      <section className="admin-panel admin-panel--flush">
        {loading ? (
          <AdminLoading label="Loading products..." />
        ) : products.length === 0 ? (
          <p className="admin-empty">No products match this view.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Visibility</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="admin-product-cell">
                        <img src={product.image} alt="" />
                        <div>
                          <strong className="admin-cell-title">{product.name}</strong>
                          <span className="admin-cell-sub">{product.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>
                      <strong>{formatCurrency(product.price)}</strong>
                      {product.compareAt && (
                        <span className="admin-cell-sub">
                          {formatCurrency(product.compareAt)}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          product.stock <= 5 ? 'admin-low-stock' : undefined
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`admin-toggle ${product.active ? 'is-on' : ''}`}
                        onClick={() => toggleActive(product)}
                        disabled={busyId === product._id}
                        aria-label={`${product.active ? 'Deactivate' : 'Activate'} ${product.name}`}
                      >
                        <span />
                        {product.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="admin-link-button"
                          onClick={() => openEdit(product)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-link-button admin-link-button--danger"
                          onClick={() => handleArchive(product)}
                          disabled={busyId === product._id}
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination pagination={pagination} onPage={setPage} />
      </section>
    </>
  )
}

export default ProductsPage
