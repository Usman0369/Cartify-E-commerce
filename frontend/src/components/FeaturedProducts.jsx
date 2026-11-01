import { SearchIcon } from './Icons.jsx'
import ProductCard from './ProductCard.jsx'
import SectionHeading from './SectionHeading.jsx'
import './FeaturedProducts.css'

function FeaturedProducts({
  products,
  categories,
  activeCategory,
  searchTerm,
  onSelectCategory,
  onAddToCart,
  onClearFilters,
}) {
  return (
    <section className="section featured" id="shop">
      <div className="container">
        <SectionHeading
          eyebrow="Handpicked for you"
          title="Featured products"
          description="A rotating edit of the pieces our team keeps coming back to — chosen for how they look, feel, and last."
          action={
            <span className="featured__count">
              <strong>{products.length}</strong>{' '}
              {products.length === 1 ? 'piece' : 'pieces'}
            </span>
          }
        />

        <div className="featured__toolbar">
          <div className="featured__chips" role="group" aria-label="Filter by category">
            <button
              type="button"
              className={`filter-chip ${activeCategory === 'All' ? 'is-active' : ''}`}
              onClick={() => onSelectCategory('All')}
              aria-pressed={activeCategory === 'All'}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`filter-chip ${
                  activeCategory === category.name ? 'is-active' : ''
                }`}
                onClick={() => onSelectCategory(category.name)}
                aria-pressed={activeCategory === category.name}
              >
                {category.name}
              </button>
            ))}
          </div>

          {searchTerm && (
            <p className="featured__search-note" aria-live="polite">
              Results for <strong>&ldquo;{searchTerm}&rdquo;</strong>
            </p>
          )}
        </div>

        {products.length > 0 ? (
          <div className="featured__grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="featured__empty">
            <span className="featured__empty-icon" aria-hidden="true">
              <SearchIcon />
            </span>
            <h3>No pieces found</h3>
            <p>
              We couldn&apos;t find anything matching your search. Try a
              different term or browse the full collection.
            </p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={onClearFilters}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default FeaturedProducts
