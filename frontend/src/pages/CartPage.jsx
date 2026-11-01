import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRightIcon,
  CartIcon,
  TrashIcon,
} from '../components/Icons.jsx'
import OrderSummary from '../components/OrderSummary.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'
import './CartPage.css'

function CartPage() {
  const {
    cartItems,
    count,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart()
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleCheckout = (event) => {
    if (cartItems.length === 0) {
      event.preventDefault()
      return
    }

    if (isAuthenticated) return

    event.preventDefault()
    navigate('/login', {
      state: {
        redirect: '/checkout',
        message: 'Sign in to continue to checkout.',
      },
    })
  }

  const handleRemoveItem = (product) => {
    removeItem(product.id)
    showToast(`${product.name} removed from cart.`)
  }

  const handleClearCart = () => {
    clearCart()
    showToast('Your cart has been cleared.')
  }

  const handleQuantityChange = (productId, value) => {
    const next = Number(value)
    if (!Number.isFinite(next) || next < 1) return
    updateQuantity(productId, next)
  }

  return (
    <section className="section cart">
      <div className="container">
        <SectionHeading
          eyebrow="Your bag"
          title="Your cart"
          description="Review your picks, adjust quantities, and apply a promo code before checkout."
          action={
            <span className="cart__count">
              <strong>{count}</strong> {count === 1 ? 'item' : 'items'}
            </span>
          }
        />

        {cartItems.length === 0 ? (
          <div className="cart__empty">
            <span className="cart__empty-icon" aria-hidden="true">
              <CartIcon />
            </span>
            <h3>Your cart is empty</h3>
            <p>
              Looks like you haven&apos;t added anything yet. Explore the
              collection and find something you love.
            </p>
            <div className="cart__empty-actions">
              <Link className="btn btn--primary" to="/shop">
                Continue shopping
              </Link>
              <Link className="btn btn--outline" to="/#best-sellers">
                Browse best sellers
              </Link>
            </div>
          </div>
        ) : (
          <div className="cart__layout">
            <div className="cart__items">
              <div className="cart__items-header">
                <p>
                  <strong>{count}</strong>{' '}
                  {count === 1 ? 'item' : 'items'} in your cart
                </p>
                <button
                  type="button"
                  className="cart__clear"
                  onClick={handleClearCart}
                >
                  Clear cart
                </button>
              </div>

              <div className="cart__list">
                {cartItems.map((item) => {
                  const { product } = item

                  return (
                    <article className="cart-item" key={product.id}>
                      <Link
                        className="cart-item__media"
                        to={`/product/${product.slug ?? product.id}`}
                        aria-label={`View ${product.name}`}
                      >
                        <img
                          className="cart-item__image"
                          src={product.image}
                          alt={product.name}
                        />
                      </Link>

                      <div className="cart-item__info">
                        <div className="cart-item__top">
                          <div>
                            <span className="cart-item__brand">
                              {product.brand}
                            </span>
                            <h3 className="cart-item__name">
                              <Link
                                to={`/product/${product.slug ?? product.id}`}
                              >
                                {product.name}
                              </Link>
                            </h3>
                            <p className="cart-item__meta">
                              {product.category} ·{' '}
                              {formatCurrency(product.price)} each
                            </p>
                            {product.stock <= 5 && (
                              <p className="cart-item__stock">
                                Only {product.stock} left in stock
                              </p>
                            )}
                          </div>
                          <span className="cart-item__line-total">
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </div>

                        <div className="cart-item__bottom">
                          <div className="cart-item__quantity">
                            <button
                              type="button"
                              aria-label={`Decrease quantity for ${product.name}`}
                              onClick={() =>
                                updateQuantity(product.id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={product.stock}
                              value={item.quantity}
                              onChange={(event) =>
                                handleQuantityChange(
                                  product.id,
                                  event.target.value,
                                )
                              }
                              aria-label={`Quantity for ${product.name}`}
                            />
                            <button
                              type="button"
                              aria-label={`Increase quantity for ${product.name}`}
                              onClick={() =>
                                updateQuantity(product.id, item.quantity + 1)
                              }
                              disabled={item.quantity >= product.stock}
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            className="cart-item__remove"
                            onClick={() => handleRemoveItem(product)}
                            aria-label={`Remove ${product.name} from cart`}
                          >
                            <TrashIcon />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>

            <OrderSummary
              showPromoForm
              showPerks
              action={
                <>
                  <Link
                    className="btn btn--primary cart__checkout"
                    to="/checkout"
                    onClick={handleCheckout}
                  >
                    Proceed to checkout
                    <ArrowRightIcon />
                  </Link>
                  <Link className="cart__continue" to="/shop">
                    Continue shopping
                  </Link>
                </>
              }
            />
          </div>
        )}
      </div>
    </section>
  )
}

export default CartPage
