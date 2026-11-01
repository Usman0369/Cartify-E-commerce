import { ArrowRightIcon } from './Icons.jsx'
import './PromoBanner.css'

function PromoBanner({ onShopClick }) {
  return (
    <section className="promo">
      <div className="container">
        <div className="promo__panel">
          <div className="promo__content">
            <span className="eyebrow eyebrow--light">Limited time</span>
            <h2 className="promo__title">
              The mid-season edit is here.
            </h2>
            <p className="promo__description">
              Take up to 40% off a handpicked collection of warm-weather
              favourites. Considered pieces, quieter prices — while they last.
            </p>
            <div className="promo__actions">
              <button
                type="button"
                className="btn btn--light"
                onClick={onShopClick}
              >
                Shop the sale
                <ArrowRightIcon />
              </button>
              <span className="promo__code">
                Use code <strong>WARM20</strong>
              </span>
            </div>
          </div>

          <div className="promo__media">
            <img
              src="/images/promo.jpg"
              alt="A warm-toned edit of seasonal wardrobe essentials"
              loading="lazy"
            />
            <span className="promo__stamp" aria-hidden="true">
              <span>Up to</span>
              <strong>40% off</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PromoBanner
