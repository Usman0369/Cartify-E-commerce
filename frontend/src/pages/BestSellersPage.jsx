import { Link } from 'react-router-dom'
import BestSellers from '../components/BestSellers.jsx'
import { ArrowRightIcon } from '../components/Icons.jsx'
import PageIntro from '../components/PageIntro.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import './BestSellersPage.css'

function BestSellersPage() {
  const { bestSellers } = useCatalog()
  const { addItem } = useCart()
  const { showToast } = useToast()

  const handleAddToCart = (product) => {
    addItem(product)
    showToast(`${product.name} added to cart.`)
  }

  return (
    <>
      <PageIntro
        eyebrow="Loved by many"
        title="Best sellers"
        description="The tried-and-true pieces our customers reach for again and again - tested by real life, not a trend cycle. Add a favourite straight to your cart."
        actions={
          <>
            <Link className="btn btn--primary" to="/shop">
              Shop all products
              <ArrowRightIcon />
            </Link>
            <Link className="btn btn--outline" to="/categories">
              Browse categories
            </Link>
          </>
        }
      />

      <BestSellers
        products={bestSellers}
        onAddToCart={handleAddToCart}
        showHeading={false}
      />

      <section className="section bestsellers-page__closing">
        <div className="container bestsellers-page__closing-inner">
          <div>
            <span className="eyebrow">Still deciding?</span>
            <h2 className="bestsellers-page__closing-title">
              There is more to explore.
            </h2>
            <p className="bestsellers-page__closing-copy">
              Browse the full collection with filters for category, brand,
              price, and rating to find exactly what you need.
            </p>
          </div>
          <Link className="btn btn--outline" to="/shop">
            View the full collection
            <ArrowRightIcon />
          </Link>
        </div>
      </section>
    </>
  )
}

export default BestSellersPage
