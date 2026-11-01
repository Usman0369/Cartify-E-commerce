import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProductReviews from '../components/ProductReviews.jsx'
import { api } from '../services/api.js'

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

const showToast = vi.hoisted(() => vi.fn())

const product = vi.hoisted(() => ({
  id: 'aero-headphones',
  slug: 'aero-wireless-headphones',
  name: 'Aero Wireless Headphones',
  rating: 4.6,
  reviews: 12,
}))

vi.mock('../services/api.js', () => ({
  apiEnabled: true,
  api: apiMock,
}))

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => globalThis.__reviewAuth,
}))

vi.mock('../context/ToastContext.jsx', () => ({
  useToast: () => ({ showToast }),
}))

function renderReviews() {
  return render(
    <MemoryRouter>
      <ProductReviews product={product} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  globalThis.__reviewAuth = { isAuthenticated: true }
})

describe('Product reviews', () => {
  it('loads reviews and shows the aggregate rating', async () => {
    api.get.mockResolvedValue({
      reviews: [
        {
          id: 'review-1',
          rating: 5,
          title: 'Excellent sound',
          body: 'Comfortable for long listening sessions.',
          verifiedPurchase: true,
          createdAt: '2026-01-15T10:00:00.000Z',
          user: { name: 'Ada' },
        },
      ],
    })

    renderReviews()

    expect(await screen.findByText('Excellent sound')).toBeInTheDocument()
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Verified purchase')).toBeInTheDocument()
    expect(screen.getByText('4.6')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith(
      '/reviews/product/aero-wireless-headphones?limit=10',
    )
  })

  it('submits a review for moderation', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ reviews: [] })
    api.post.mockResolvedValue({})

    renderReviews()
    await waitFor(() => expect(api.get).toHaveBeenCalled())

    await user.selectOptions(screen.getByLabelText('Rating'), '4')
    await user.type(screen.getByLabelText('Title (optional)'), 'Great value')
    await user.type(
      screen.getByLabelText('Your review'),
      'The battery lasts all day and the fit is comfortable.',
    )
    await user.click(screen.getByRole('button', { name: /submit review/i }))

    await waitFor(() => expect(api.post).toHaveBeenCalled())
    expect(api.post).toHaveBeenCalledWith('/reviews', {
      productId: 'aero-headphones',
      rating: 4,
      title: 'Great value',
      body: 'The battery lasts all day and the fit is comfortable.',
    })
    expect(
      screen.getByText('Thanks! Your review is awaiting moderation.'),
    ).toBeInTheDocument()
  })

  it('asks guests to sign in before reviewing', async () => {
    globalThis.__reviewAuth = { isAuthenticated: false }
    api.get.mockResolvedValue({ reviews: [] })

    renderReviews()

    expect(
      screen.getByRole('link', { name: /sign in to review/i }),
    ).toHaveAttribute(
      'href',
      '/login?redirect=%2Fproduct%2Faero-wireless-headphones',
    )
  })
})
