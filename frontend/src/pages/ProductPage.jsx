import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRightIcon,
  CartIcon,
  CheckIcon,
  HeartIcon,
  ReturnIcon,
  ShieldIcon,
  StarIcon,
  TruckIcon,
} from '../components/Icons.jsx'
import ProductCard from '../components/ProductCard.jsx'
import ProductReviews from '../components/ProductReviews.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'
import NotFoundPage from './NotFoundPage.jsx'
import './ProductPage.css'

const MAX_RELATED = 3

function ProductPage() {
  const { slug } = useParams()
  const { products } = useCatalog()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const { isWishlisted, toggle } = useWishlist()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const timerRef = useRef(null)

  const product = useMemo(
    () => products.find((entry) => entry.slug === slug || entry.id === slug),
    [products, slug],
  )

  const relatedProducts = useMemo(() => {
    if (!product) return []

    return products
      .filter((entry) => entry.id !== product.id)
      .filter(
        (entry) =>
          entry.category === product.category || entry.brand === product.brand,
      )
      .slice(0, MAX_RELATED)
  }, [product, products])

  useEffect(() => {
    setQuantity(1)
    setAdded(false)
    window.clearTimeout(timerRef.current)
  }, [slug])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  if (!product) return <NotFoundPage />

  const saved = isWishlisted(product.id)
  const maxQuantity = Math.max(1, product.stock ?? 1)
  const outOfStock = product.stock === 0
  const discount = product.compareAt
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : null
  const stockLabel = outOfStock
    ? 'Out of stock'
    : product.stock <= 5
      ? `Only ${product.stock} left in stock`
      : 'In stock'

  const clampQuantity = (value) => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return 1
    return Math.min(maxQuantity, Math.max(1, Math.floor(parsed)))
  }

  const handleQuantityInput = (event) => {
    if (event.target.value === '') {
      setQuantity('')
      return
    }

    setQuantity(clampQuantity(event.target.value))
  }

  const handleQuantityBlur = () => {
    setQuantity((current) =>
      current === '' ? 1 : clampQuantity(current),
    )
  }

  const adjustQuantity = (delta) => {
    setQuantity((current) => clampQuantity(Number(current) + delta))
  }

  const handleAddToCart = () => {
    if (outOfStock) return

    addItem(product, clampQuantity(quantity))
    showToast(`${product.name} added to cart.`)
    setAdded(true)
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setAdded(false), 1500)
  }

  const handleRelatedAddToCart = (relatedProduct) => {
    addItem(relatedProduct)
    showToast(`${relatedProduct.name} added to cart.`)
  }

  return (
    <>
      <section className="section product-detail">
        <div className="container">
          <nav
            className="product-detail__breadcrumb"
            aria-label="Breadcrumb"
          >
            <Link to="/">Home</Link>
            <span className="product-detail__separator" aria-hidden="true">
              /
            </span>
            <Link to="/shop">Shop</Link>
            <span className="product-detail__separator" aria-hidden="true">
              /
            </span>
            <Link
              to={`/shop?category=${encodeURIComponent(product.category)}`}
            >
              {product.category}
            </Link>
            <span className="product-detail__separator" aria-hidden="true">
              /
            </span>
            <span aria-current="page">{product.name}</span>
          </nav>

          <div className="product-detail__layout">
            <div className="product-detail__media">
              <img
                className="product-detail__image"
                src={product.image}
                alt={product.name}
              />
              {product.badge && (
                <span className="product-detail__badge">{product.badge}</span>
              )}
              {discount && (
                <span className="product-detail__discount">-{discount}%</span>
              )}
            </div>

            <div className="product-detail__info">
              <div className="product-detail__meta">
                <Link
                  className="product-detail__brand"
                  to={`/shop?brand=${encodeURIComponent(product.brand)}`}
                >
                  {product.brand}
                </Link>
                <span className="product-detail__meta-dot" aria-hidden="true">
                  ·
                </span>
                <Link
                  className="product-detail__category"
                  to={`/shop?category=${encodeURIComponent(product.category)}`}
                >
                  {product.category}
                </Link>
              </div>

              <h1 className="product-detail__title">{product.name}</h1>

              <div
                className="product-detail__rating"
                aria-label={`Rated ${product.rating} out of 5 from ${product.reviews} reviews`}
              >
                <span className="product-detail__stars" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <StarIcon
                      key={index}
                      className={
                        index < Math.round(product.rating) ? 'is-filled' : ''
                      }
                    />
                  ))}
                </span>
                <span className="product-detail__rating-value">
                  {product.rating.toFixed(1)}
                </span>
                <span className="product-detail__reviews">
                  ({product.reviews} reviews)
                </span>
              </div>

              <div className="product-detail__price-row">
                <span className="product-detail__price">
                  {formatCurrency(product.price)}
                </span>
                {product.compareAt && (
                  <span className="product-detail__compare">
                    {formatCurrency(product.compareAt)}
                  </span>
                )}
                {discount && (
                  <span className="product-detail__save">
                    Save {discount}%
                  </span>
                )}
              </div>

              <p className="product-detail__description">
                {product.description}
              </p>

              <p
                className={`product-detail__stock ${
                  outOfStock
                    ? 'is-out'
                    : product.stock <= 5
                      ? 'is-low'
                      : ''
                }`}
              >
                <span
                  className="product-detail__stock-dot"
                  aria-hidden="true"
                />
                {stockLabel}
              </p>

              <div className="product-detail__purchase">
                <div className="product-detail__quantity">
                  <label
                    className="product-detail__quantity-label"
                    htmlFor="product-quantity"
                  >
                    Quantity
                  </label>
                  <div className="quantity-control">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => adjustQuantity(-1)}
                      disabled={outOfStock || Number(quantity) <= 1}
                    >
                      −
                    </button>
                    <input
                      id="product-quantity"
                      type="number"
                      min="1"
                      max={maxQuantity}
                      value={quantity}
                      onChange={handleQuantityInput}
                      onBlur={handleQuantityBlur}
                      disabled={outOfStock}
                    />
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => adjustQuantity(1)}
                      disabled={
                        outOfStock || Number(quantity) >= maxQuantity
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className={`btn btn--primary product-detail__add ${
                    added ? 'is-added' : ''
                  }`}
                  onClick={handleAddToCart}
                  aria-label={`Add ${product.name} to cart`}
                  disabled={outOfStock}
                >
                  {added ? <CheckIcon /> : <CartIcon />}
                  <span>
                    {outOfStock
                      ? 'Out of stock'
                      : added
                        ? 'Added to cart'
                        : 'Add to cart'}
                  </span>
                </button>
              </div>

              <button
                type="button"
                className={`product-detail__wishlist${
                  saved ? ' is-active' : ''
                }`}
                onClick={() => toggle(product)}
                aria-pressed={saved}
              >
                <HeartIcon />
                <span>
                  {saved ? 'Saved to wishlist' : 'Save to wishlist'}
                </span>
              </button>

              <ul className="product-detail__perks">
                <li>
                  <TruckIcon />
                  <span>
                    <strong>Free shipping</strong> on orders over $75
                  </span>
                </li>
                <li>
                  <ReturnIcon />
                  <span>
                    <strong>30-day returns</strong> for a full refund
                  </span>
                </li>
                <li>
                  <ShieldIcon />
                  <span>
                    <strong>Secure checkout</strong> with encrypted payment
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="product-detail__details">
            <section className="product-detail__panel">
              <h2>Why you&apos;ll love it</h2>
              <ul className="product-detail__features">
                {product.features.map((feature) => (
                  <li key={feature}>
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="product-detail__panel">
              <h2>Specifications</h2>
              <dl className="product-detail__specs">
                {product.specs.map((spec) => (
                  <div key={spec.label}>
                    <dt>{spec.label}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>
      </section>

      <ProductReviews product={product} />

      {relatedProducts.length > 0 && (
        <section className="section product-detail__related">
          <div className="container">
            <SectionHeading
              eyebrow="Keep exploring"
              title="You may also like"
              description="More pieces from the same category and brand, chosen to pair well with your find."
              action={
                <Link className="text-link" to="/shop">
                  View all products
                  <ArrowRightIcon />
                </Link>
              }
            />

            <div className="product-detail__related-grid">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  onAddToCart={handleRelatedAddToCart}
                  showBrand
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

export default ProductPage
