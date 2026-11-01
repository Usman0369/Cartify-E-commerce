import { Link } from 'react-router-dom'
import { ArrowRightIcon } from './Icons.jsx'
import SectionHeading from './SectionHeading.jsx'
import './Categories.css'

function Categories({ categories, activeCategory, onSelectCategory }) {
  return (
    <section className="section categories" id="categories">
      <div className="container">
        <SectionHeading
          eyebrow="Find your next favourite"
          title="Shop by category"
          description="Six considered edits, each filled with pieces chosen for quality, comfort, and everyday use."
          action={
            <Link className="text-link" to="/shop">
              View all products
              <ArrowRightIcon />
            </Link>
          }
        />

        <div className="categories__grid">
          {categories.map((category) => {
            const isActive = activeCategory === category.name

            return (
              <button
                key={category.id}
                type="button"
                className={`category-card ${isActive ? 'is-active' : ''}`}
                onClick={() => onSelectCategory(category.name)}
                aria-pressed={isActive}
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
                    <span className="category-card__arrow" aria-hidden="true">
                      <ArrowRightIcon />
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Categories
