import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { storageKeys, writeStorage } from '../services/storage.js'
import { getSafeRedirect } from '../utils/redirect.js'
import { renderApp } from './renderWithProviders.jsx'

const auth = vi.hoisted(() => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  initializing: false,
  login: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('../context/AuthContext.jsx', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAuth: () => auth,
  }
})

function seedCart(items) {
  writeStorage(storageKeys.cart, items)
}

function authenticate() {
  auth.user = { id: 'checkout-user', name: 'Avery Stone', role: 'customer' }
  auth.isAuthenticated = true
  return { user: auth.user }
}

beforeEach(() => {
  auth.user = null
  auth.isAuthenticated = false
  auth.isAdmin = false
  auth.initializing = false
  auth.login.mockReset()
  auth.logout.mockReset()
})

describe('Checkout authentication flow', () => {
  it('redirects direct checkout visits to login', () => {
    seedCart([{ productId: 'aero-headphones', quantity: 1 }])

    renderApp(['/checkout'])

    expect(
      screen.getByRole('heading', { name: /sign in to cartify/i }),
    ).toBeInTheDocument()
  })

  it('redirects guest checkout clicks to login and returns to checkout after sign in', async () => {
    const user = userEvent.setup()
    seedCart([{ productId: 'aero-headphones', quantity: 2 }])
    auth.login.mockImplementation(async () => authenticate())
    renderApp(['/cart'])

    await user.click(
      screen.getByRole('link', { name: /proceed to checkout/i }),
    )

    expect(
      screen.getByRole('heading', { name: /sign in to cartify/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/sign in to continue to checkout/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/email address/i), 'avery@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(
      await screen.findByRole('heading', { name: 'Checkout' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /shopping cart with 2 items/i }),
    ).toBeInTheDocument()

    const summary = screen.getByRole('complementary', {
      name: /order summary/i,
    })
    expect(within(summary).getAllByText('$258')).toHaveLength(2)
  })

  it('returns to checkout after login from a protected direct visit', async () => {
    const user = userEvent.setup()
    seedCart([{ productId: 'flow-yoga-mat', quantity: 1 }])
    auth.login.mockImplementation(async () => authenticate())
    renderApp(['/login?redirect=%2Fcheckout'])

    await user.type(screen.getByLabelText(/email address/i), 'avery@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(
      await screen.findByRole('heading', { name: 'Checkout' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /shopping cart with 1 item/i }),
    ).toBeInTheDocument()
  })

  it('opens checkout directly for a signed-in customer', async () => {
    const user = userEvent.setup()
    seedCart([{ productId: 'flow-yoga-mat', quantity: 1 }])
    authenticate()
    renderApp(['/cart'])

    await user.click(
      screen.getByRole('link', { name: /proceed to checkout/i }),
    )

    expect(
      screen.getByRole('heading', { name: 'Checkout' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /shopping cart with 1 item/i }),
    ).toBeInTheDocument()
  })

  it('keeps empty carts on the cart page', () => {
    renderApp(['/cart'])

    expect(
      screen.getByRole('heading', { name: /your cart is empty/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /proceed to checkout/i }),
    ).not.toBeInTheDocument()
  })
})

describe('Safe redirect validation', () => {
  it('accepts internal destinations', () => {
    expect(getSafeRedirect('/checkout')).toBe('/checkout')
    expect(getSafeRedirect('/account?tab=orders')).toBe('/account?tab=orders')
  })

  it('rejects external and auth destinations', () => {
    expect(getSafeRedirect('https://example.com')).toBe('/account')
    expect(getSafeRedirect('//example.com')).toBe('/account')
    expect(getSafeRedirect('/login?redirect=/checkout')).toBe('/account')
    expect(getSafeRedirect('/\\example.com')).toBe('/account')
  })
})
