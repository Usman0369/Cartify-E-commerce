import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '../components/Icons.jsx'
import PageIntro from '../components/PageIntro.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'
import '../components/Categories.css'
import './CategoriesPage.css'

function categorySummary(name, products) {
  const categoryProducts = products.filter(
    (product) => product.category === name,
  )
  const lowestPrice = categoryProducts.length
    ? Math.min(...categoryProducts.map((product) => product.price))
    : null

  return { count: categoryProducts.length, lowestPrice }
}

function CategoriesPage() {
  const { categories, products } = useCatalog()

  return (
    <>
      <PageIntro
        eyebrow="Find your next favourite"
        title="Shop by category"
        description="Six considered edits, each filled with pieces chosen for quality, comfort, and everyday use. Pick a category to jump straight into the edit."
        actions={
          <Link className="btn btn--outline" to="/shop">
            View all products
            <ArrowRightIcon />
          </Link>
        }
      />

      <section className="section categories-page" aria-label="Categories">
        <div className="container">
          <div className="categories__grid categories-page__grid">
            {categories.map((category) => {
              const { count, lowestPrice } = categorySummary(
                category.name,
                products,
              )

              return (
                <Link
                  key={category.id}
                  className="category-card categories-page__card"
                  to={`/shop?category=${encodeURIComponent(category.name)}`}
                  aria-label={`Shop ${category.name}`}
                >
                  <img
                    className="category-card__image"
                    src={category.image}
                    alt=""
                    loading="lazy"
                  />
                  <span className="category-card__overlay" aria-hidden="true" />
                  <span className="category-card__content">
                    <span className="category-card__tagline">
                      {category.tagline}
                    </span>
                    <span className="category-card__row">
                      <span className="category-card__name">
                        {category.name}
                      </span>
                      <span
                        className="category-card__arrow"
                        aria-hidden="true"
                      >
                        <ArrowRightIcon />
                      </span>
                    </span>
                    <span className="categories-page__meta">
                      {count} {count === 1 ? 'product' : 'products'}
                      {lowestPrice !== null &&
                        ` from ${formatCurrency(lowestPrice)}`}
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section section--soft categories-page__help">
        <div className="container categories-page__help-inner">
          <div>
            <span className="eyebrow">Need a little direction?</span>
            <h2 className="categories-page__help-title">
              Start with what everyone loves.
            </h2>
            <p className="categories-page__help-copy">
              Browse the pieces our customers reach for most, or explore the
              full collection with filters for brand, price, and rating.
            </p>
          </div>
          <div className="categories-page__help-actions">
            <Link className="btn btn--primary" to="/best-sellers">
              Shop best sellers
              <ArrowRightIcon />
            </Link>
            <Link className="btn btn--outline" to="/shop">
              Browse all products
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default CategoriesPage
