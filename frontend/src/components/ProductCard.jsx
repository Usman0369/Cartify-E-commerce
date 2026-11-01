import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartIcon, HeartIcon, StarIcon } from './Icons.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import './ProductCard.css'

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

function ProductCard({ product, onAddToCart, showBrand = false }) {
  const [added, setAdded] = useState(false)
  const timerRef = useRef(null)
  const { isWishlisted, toggle } = useWishlist()
  const saved = isWishlisted(product.id)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const discount = product.compareAt
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : null
  const productPath = `/product/${product.slug ?? product.id}`
  const isOutOfStock = product.stock === 0

  const handleAdd = () => {
    onAddToCart(product)
    setAdded(true)
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setAdded(false), 1500)
  }

  return (
    <article className="product-card">
      <Link
        className="product-card__media"
        to={productPath}
        aria-label={`View ${product.name}`}
      >
        <img
          className="product-card__image"
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
        {product.badge && (
          <span className="product-card__badge">{product.badge}</span>
        )}
        {discount && (
          <span className="product-card__discount">-{discount}%</span>
        )}
      </Link>

      <button
        type="button"
        className={`product-card__wishlist${saved ? ' is-active' : ''}`}
        onClick={() => toggle(product)}
        aria-label={
          saved
            ? `Remove ${product.name} from wishlist`
            : `Save ${product.name} to wishlist`
        }
        aria-pressed={saved}
      >
        <HeartIcon />
      </button>

      <div className="product-card__body">
        {showBrand && product.brand && (
          <span className="product-card__brand">{product.brand}</span>
        )}
        <span className="product-card__category">{product.category}</span>
        <h3 className="product-card__name">
          <Link to={productPath}>{product.name}</Link>
        </h3>
        <div className="product-card__rating" aria-label={`Rated ${product.rating} out of 5`}>
          <StarIcon />
          <span>
            {product.rating.toFixed(1)}
            <span className="product-card__reviews"> ({product.reviews})</span>
          </span>
        </div>

        <div className="product-card__price-row">
          <span className="product-card__price">{formatPrice(product.price)}</span>
          {product.compareAt && (
            <span className="product-card__compare">
              {formatPrice(product.compareAt)}
            </span>
          )}
        </div>

        <button
          type="button"
          className={`product-card__add ${added ? 'is-added' : ''}`}
          onClick={handleAdd}
          aria-label={`Add ${product.name} to cart`}
          disabled={isOutOfStock}
        >
          <CartIcon />
          <span>
            {isOutOfStock ? 'Out of stock' : added ? 'Added to cart' : 'Add to cart'}
          </span>
        </button>
      </div>
    </article>
  )
}

export default ProductCard
