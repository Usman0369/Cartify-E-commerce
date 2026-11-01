import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CartProvider, useCart } from '../context/CartContext.jsx'
import { storageKeys, writeStorage } from '../services/storage.js'
import { api } from '../services/api.js'

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

const product = vi.hoisted(() => ({
  id: 'aero-headphones',
  name: 'Aero Wireless Headphones',
  price: 129,
  stock: 10,
}))

vi.mock('../services/api.js', () => ({
  apiEnabled: true,
  api: apiMock,
}))

vi.mock('../context/CatalogContext.jsx', () => ({
  useCatalog: () => ({ products: [product] }),
}))

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => globalThis.__cartAuthState,
}))

function CartHarness() {
  const { count, addItem } = useCart()

  return (
    <div>
      <span data-testid="cart-count">{count}</span>
      <button type="button" onClick={() => addItem(product)}>
        Add product
      </button>
    </div>
  )
}

function renderCart() {
  return render(
    <CartProvider>
      <CartHarness />
    </CartProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  vi.clearAllMocks()
  globalThis.__cartAuthState = {
    user: { id: 'user-1' },
    isAuthenticated: true,
    initializing: false,
  }
})

describe('Cart synchronization', () => {
  it('merges a guest cart into the signed-in account', async () => {
    writeStorage(storageKeys.cart, [
      { productId: 'aero-headphones', quantity: 2 },
    ])
    api.post.mockResolvedValue({
      cart: {
        items: [{ productId: 'aero-headphones', quantity: 2 }],
      },
    })
    api.get.mockResolvedValue({
      cart: {
        items: [{ productId: 'aero-headphones', quantity: 2 }],
      },
    })

    renderCart()

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/cart/merge', {
        items: [{ productId: 'aero-headphones', quantity: 2 }],
      })
    })
    expect(await screen.findByTestId('cart-count')).toHaveTextContent('2')
  })

  it('loads the server cart for a returning user without merging twice', async () => {
    writeStorage(storageKeys.cartOwner, 'user-1')
    writeStorage(storageKeys.cart, [
      { productId: 'aero-headphones', quantity: 1 },
    ])
    api.get.mockResolvedValue({
      cart: {
        items: [{ productId: 'aero-headphones', quantity: 3 }],
      },
    })

    renderCart()

    expect(await screen.findByTestId('cart-count')).toHaveTextContent('3')
    expect(api.get).toHaveBeenCalledWith('/cart')
    expect(api.post).not.toHaveBeenCalledWith(
      '/auth/cart/merge',
      expect.anything(),
    )
  })

  it('saves additions to the server cart for authenticated users', async () => {
    writeStorage(storageKeys.cartOwner, 'user-1')
    api.get.mockResolvedValue({ cart: { items: [] } })
    api.post.mockResolvedValue({
      cart: {
        items: [{ productId: 'aero-headphones', quantity: 1 }],
      },
    })
    const user = userEvent.setup()

    renderCart()
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/cart'))

    await user.click(screen.getByRole('button', { name: 'Add product' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/cart', {
        productId: 'aero-headphones',
        quantity: 1,
      })
    })
  })
})
