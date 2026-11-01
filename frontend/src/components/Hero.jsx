import { ArrowRightIcon, StarIcon, TruckIcon } from './Icons.jsx'
import './Hero.css'

function Hero({ onShopClick, onCategoriesClick }) {
  return (
    <section className="hero" id="home">
      <div className="container hero__grid">
        <div className="hero__content">
          <span className="eyebrow">The spring edit · 2026</span>
          <h1 className="hero__title">
            Everyday essentials,
            <span>thoughtfully curated.</span>
          </h1>
          <p className="hero__description">
            Discover considered pieces for the way you live — from quiet tech
            and easy layers to small comforts that make a space feel like home.
          </p>
          <div className="hero__actions">
            <button type="button" className="btn btn--primary" onClick={onShopClick}>
              Shop the collection
              <ArrowRightIcon />
            </button>
            <button
              type="button"
              className="btn btn--outline"
              onClick={onCategoriesClick}
            >
              Browse categories
            </button>
          </div>

          <dl className="hero__stats">
            <div className="hero__stat">
              <dt>Curated pieces</dt>
              <dd>1,200+</dd>
            </div>
            <div className="hero__stat">
              <dt>Customer rating</dt>
              <dd>4.9/5</dd>
            </div>
            <div className="hero__stat">
              <dt>Orders shipped</dt>
              <dd>48k+</dd>
            </div>
          </dl>
        </div>

        <div className="hero__visual">
          <div className="hero__image-frame">
            <img
              className="hero__image"
              src="/images/hero.jpg"
              alt="A calm, curated edit of everyday lifestyle essentials"
              fetchPriority="high"
            />
          </div>

          <div className="hero__discount" aria-hidden="true">
            <span>Up to</span>
            <strong>40%</strong>
            <span>off the edit</span>
          </div>

          <div className="hero__product">
            <img src="/images/headphones.jpg" alt="" />
            <div className="hero__product-copy">
              <span className="hero__product-label">Editor&apos;s pick</span>
              <strong>Aero Headphones</strong>
              <div className="hero__product-meta">
                <span>$129</span>
                <span className="hero__product-rating">
                  <StarIcon /> 4.8
                </span>
              </div>
            </div>
          </div>

          <div className="hero__shipping">
            <TruckIcon />
            <span>
              Free delivery over <strong>$75</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
