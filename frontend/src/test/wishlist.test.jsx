import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  WishlistProvider,
  useWishlist,
} from '../context/WishlistContext.jsx'
import { api } from '../services/api.js'

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}))

const showToast = vi.hoisted(() => vi.fn())

const product = vi.hoisted(() => ({
  id: 'aero-headphones',
  name: 'Aero Wireless Headphones',
  price: 129,
}))

vi.mock('../services/api.js', () => ({
  apiEnabled: true,
  api: apiMock,
}))

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => globalThis.__wishlistAuth,
}))

vi.mock('../context/ToastContext.jsx', () => ({
  useToast: () => ({ showToast }),
}))

function WishlistHarness() {
  const { items, isWishlisted, toggle } = useWishlist()

  return (
    <div>
      <span data-testid="wishlist-count">{items.length}</span>
      <span data-testid="is-saved">{String(isWishlisted(product.id))}</span>
      <button type="button" onClick={() => toggle(product)}>
        Toggle wishlist
      </button>
    </div>
  )
}

function renderWishlist() {
  return render(
    <WishlistProvider>
      <WishlistHarness />
    </WishlistProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  globalThis.__wishlistAuth = {
    isAuthenticated: true,
    initializing: false,
  }
})

describe('Wishlist synchronization', () => {
  it('loads the saved wishlist for a signed-in customer', async () => {
    api.get.mockResolvedValue({ items: [product] })

    renderWishlist()

    await waitFor(() =>
      expect(screen.getByTestId('wishlist-count')).toHaveTextContent('1'),
    )
    expect(api.get).toHaveBeenCalledWith('/wishlist')
    expect(screen.getByTestId('is-saved')).toHaveTextContent('true')
  })

  it('saves a product to the server wishlist', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ items: [] })
    api.post.mockResolvedValue({})

    renderWishlist()
    await waitFor(() => expect(api.get).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: /toggle wishlist/i }))

    await waitFor(() =>
      expect(screen.getByTestId('wishlist-count')).toHaveTextContent('1'),
    )
    expect(api.post).toHaveBeenCalledWith('/wishlist/aero-headphones')
    expect(showToast).toHaveBeenCalledWith(
      'Aero Wireless Headphones saved to your wishlist.',
    )
  })

  it('removes a product that is already saved', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ items: [product] })
    api.delete.mockResolvedValue({})

    renderWishlist()
    await waitFor(() =>
      expect(screen.getByTestId('wishlist-count')).toHaveTextContent('1'),
    )

    await user.click(screen.getByRole('button', { name: /toggle wishlist/i }))

    await waitFor(() =>
      expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0'),
    )
    expect(api.delete).toHaveBeenCalledWith('/wishlist/aero-headphones')
    expect(showToast).toHaveBeenCalledWith(
      'Aero Wireless Headphones removed from your wishlist.',
    )
  })

  it('prompts guests to sign in instead of calling the API', async () => {
    const user = userEvent.setup()
    globalThis.__wishlistAuth = {
      isAuthenticated: false,
      initializing: false,
    }

    renderWishlist()
    await user.click(screen.getByRole('button', { name: /toggle wishlist/i }))

    expect(api.post).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith(
      'Sign in to save items to your wishlist.',
    )
  })
})
