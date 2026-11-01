import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CloseIcon, SearchIcon } from '../components/Icons.jsx'
import ProductCard from '../components/ProductCard.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'
import { useSearch } from '../context/SearchContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'
import './ShopPage.css'

const INITIAL_VISIBLE = 8
const LOAD_MORE_STEP = 4

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating-desc', label: 'Top rated' },
  { value: 'newest', label: 'Newest' },
]

function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)
  const { brands, categories, products } = useCatalog()
  const { addItem } = useCart()
  const { setSearchTerm } = useSearch()
  const { showToast } = useToast()

  const rawCategory = searchParams.get('category') ?? 'All'
  const rawBrand = searchParams.get('brand') ?? 'All'
  const rawSort = searchParams.get('sort') ?? 'featured'
  const query = searchParams.get('q') ?? ''
  const minPrice = searchParams.get('min') ?? ''
  const maxPrice = searchParams.get('max') ?? ''

  const category = categories.some((entry) => entry.name === rawCategory)
    ? rawCategory
    : 'All'
  const brand = brands.includes(rawBrand) ? rawBrand : 'All'
  const sort = sortOptions.some((entry) => entry.value === rawSort)
    ? rawSort
    : 'featured'

  useEffect(() => {
    setSearchTerm(query)
  }, [query, setSearchTerm])

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE)
  }, [query, category, brand, minPrice, maxPrice, sort])

  const catalogOrder = useMemo(
    () => new Map(products.map((product, index) => [product.id, index])),
    [products],
  )

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase()
    const min = minPrice === '' ? null : Number(minPrice)
    const max = maxPrice === '' ? null : Number(maxPrice)

    return products.filter((product) => {
      const matchesSearch =
        !search ||
        [product.name, product.brand, product.category, product.description].some(
          (value) => value.toLowerCase().includes(search),
        )
      const matchesCategory =
        category === 'All' || product.category === category
      const matchesBrand = brand === 'All' || product.brand === brand
      const matchesMin =
        min === null || Number.isNaN(min) || product.price >= min
      const matchesMax =
        max === null || Number.isNaN(max) || product.price <= max

      return matchesSearch && matchesCategory && matchesBrand && matchesMin && matchesMax
    })
  }, [brand, category, maxPrice, minPrice, products, query])

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts]

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'rating-desc':
        list.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
        break
      case 'newest':
        list.sort(
          (a, b) => catalogOrder.get(b.id) - catalogOrder.get(a.id),
        )
        break
      default:
        list.sort(
          (a, b) => catalogOrder.get(a.id) - catalogOrder.get(b.id),
        )
    }

    return list
  }, [catalogOrder, filteredProducts, sort])

  const visibleProducts = sortedProducts.slice(0, visibleCount)
  const hasMore = visibleCount < sortedProducts.length
  const remaining = sortedProducts.length - visibleProducts.length
  const hasFilters =
    Boolean(query) ||
    category !== 'All' ||
    brand !== 'All' ||
    Boolean(minPrice) ||
    Boolean(maxPrice)

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    const normalized = typeof value === 'string' ? value.trim() : value
    const shouldRemove =
      !normalized ||
      normalized === 'All' ||
      (key === 'sort' && normalized === 'featured')

    if (shouldRemove) next.delete(key)
    else next.set(key, normalized)

    setSearchParams(next, { replace: true })
  }

  const clearPrice = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('min')
    next.delete('max')
    setSearchParams(next, { replace: true })
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const handleAddToCart = (product) => {
    addItem(product)
    showToast(`${product.name} added to cart.`)
  }

  const priceLabel = (() => {
    if (minPrice && maxPrice) {
      return `${formatCurrency(Number(minPrice))}–${formatCurrency(Number(maxPrice))}`
    }
    if (minPrice) return `From ${formatCurrency(Number(minPrice))}`
    if (maxPrice) return `Under ${formatCurrency(Number(maxPrice))}`
    return ''
  })()

  return (
    <section className="section shop" id="shop-page">
      <div className="container">
        <SectionHeading
          eyebrow="The full collection"
          title="Shop all products"
          description="Explore every piece in the Cartify edit. Filter by category, brand, or price to find exactly what you need."
          action={
            <span className="shop__count">
              <strong>{products.length}</strong> products
            </span>
          }
        />

        <div className="shop__layout">
          <aside className="shop__filters" aria-label="Product filters">
            <div className="shop__search">
              <SearchIcon />
              <label className="sr-only" htmlFor="shop-search">
                Search the shop
              </label>
              <input
                id="shop-search"
                type="search"
                value={query}
                onChange={(event) => updateParam('q', event.target.value)}
                placeholder="Search products or brands..."
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="shop__search-clear"
                  aria-label="Clear shop search"
                  onClick={() => updateParam('q', '')}
                >
                  <CloseIcon />
                </button>
              )}
            </div>

            <label className="shop__field">
              <span className="shop__label">Category</span>
              <select
                className="shop__select"
                value={category}
                onChange={(event) =>
                  updateParam('category', event.target.value)
                }
              >
                <option value="All">All categories</option>
                {categories.map((entry) => (
                  <option key={entry.id} value={entry.name}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="shop__field">
              <span className="shop__label">Brand</span>
              <select
                className="shop__select"
                value={brand}
                onChange={(event) => updateParam('brand', event.target.value)}
              >
                <option value="All">All brands</option>
                {brands.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="shop__field shop__field--price">
              <legend className="shop__label">Price</legend>
              <div className="shop__price-row">
                <label>
                  <span className="sr-only">Min price</span>
                  <input
                    className="shop__price-input"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={minPrice}
                    onChange={(event) =>
                      updateParam('min', event.target.value)
                    }
                    placeholder="Min"
                    aria-label="Min price"
                  />
                </label>
                <span aria-hidden="true">–</span>
                <label>
                  <span className="sr-only">Max price</span>
                  <input
                    className="shop__price-input"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={maxPrice}
                    onChange={(event) =>
                      updateParam('max', event.target.value)
                    }
                    placeholder="Max"
                    aria-label="Max price"
                  />
                </label>
              </div>
            </fieldset>

            <label className="shop__field">
              <span className="shop__label">Sort by</span>
              <select
                className="shop__select"
                value={sort}
                onChange={(event) => updateParam('sort', event.target.value)}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="shop__clear"
              onClick={clearFilters}
              disabled={!hasFilters && sort === 'featured'}
            >
              Clear all filters
            </button>
          </aside>

          <div className="shop__results">
            <div className="shop__results-header">
              <p className="shop__results-count" aria-live="polite">
                Showing <strong>{visibleProducts.length}</strong> of{' '}
                <strong>{sortedProducts.length}</strong>{' '}
                {sortedProducts.length === 1 ? 'product' : 'products'}
              </p>
            </div>

            {hasFilters && (
              <div className="shop__active" aria-label="Active filters">
                {query && (
                  <button
                    type="button"
                    className="shop__chip"
                    onClick={() => updateParam('q', '')}
                  >
                    Search: {query}
                    <CloseIcon />
                  </button>
                )}
                {category !== 'All' && (
                  <button
                    type="button"
                    className="shop__chip"
                    onClick={() => updateParam('category', 'All')}
                  >
                    {category}
                    <CloseIcon />
                  </button>
                )}
                {brand !== 'All' && (
                  <button
                    type="button"
                    className="shop__chip"
                    onClick={() => updateParam('brand', 'All')}
                  >
                    {brand}
                    <CloseIcon />
                  </button>
                )}
                {priceLabel && (
                  <button
                    type="button"
                    className="shop__chip"
                    onClick={clearPrice}
                  >
                    {priceLabel}
                    <CloseIcon />
                  </button>
                )}
                <button
                  type="button"
                  className="shop__clear-inline"
                  onClick={clearFilters}
                >
                  Clear all
                </button>
              </div>
            )}

            {visibleProducts.length > 0 ? (
              <>
                <div className="shop__grid">
                  {visibleProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      showBrand
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="shop__more">
                    <button
                      type="button"
                      className="btn btn--outline"
                      onClick={() =>
                        setVisibleCount((count) =>
                          Math.min(
                            count + LOAD_MORE_STEP,
                            sortedProducts.length,
                          ),
                        )
                      }
                    >
                      Load more products
                    </button>
                    <span>
                      {remaining} more {remaining === 1 ? 'product' : 'products'}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="shop__empty">
                <span className="shop__empty-icon" aria-hidden="true">
                  <SearchIcon />
                </span>
                <h3>No products found</h3>
                <p>
                  We couldn&apos;t find anything matching those filters. Try a
                  different search or clear the filters.
                </p>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ShopPage
