import { Link } from 'react-router-dom'
import { ArrowRightIcon, CartIcon, StarIcon } from './Icons.jsx'
import SectionHeading from './SectionHeading.jsx'
import './BestSellers.css'

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function BestSellers({ products, onAddToCart, showHeading = true }) {
  return (
    <section className="section section--soft bestsellers" id="best-sellers">
      <div className="container">
        {showHeading && (
          <SectionHeading
            eyebrow="Loved by many"
            title="Best sellers"
            description="The tried-and-true pieces our customers reach for again and again - tested by real life, not a trend cycle."
            action={
              <Link className="text-link" to="/shop">
                Shop all products
                <ArrowRightIcon />
              </Link>
            }
          />
        )}

        <div className="bestsellers__grid">
          {products.map((product, index) => (
            <article className="best-card" key={product.id}>
              <span className="best-card__rank" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className="best-card__media">
                <img
                  className="best-card__image"
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                />
                {product.badge && (
                  <span className="best-card__badge">{product.badge}</span>
                )}
              </div>

              <div className="best-card__content">
                <span className="best-card__category">{product.category}</span>
                <h3 className="best-card__name">{product.name}</h3>
                <div
                  className="best-card__rating"
                  aria-label={`Rated ${product.rating} out of 5`}
                >
                  <StarIcon />
                  <span>
                    {product.rating.toFixed(1)}
                    <span className="best-card__reviews">
                      {' '}
                      ({product.reviews} reviews)
                    </span>
                  </span>
                </div>
                <p className="best-card__description">{product.description}</p>

                <div className="best-card__footer">
                  <div className="best-card__price">
                    <strong>{formatPrice(product.price)}</strong>
                    {product.compareAt && (
                      <span>{formatPrice(product.compareAt)}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="best-card__add"
                    onClick={() => onAddToCart(product)}
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <CartIcon />
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default BestSellers
