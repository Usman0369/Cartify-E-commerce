import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  readStorage,
  storageKeys,
  writeStorage,
} from '../services/storage.js'
import { renderApp } from './renderWithProviders.jsx'

vi.mock('../context/AuthContext.jsx', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'checkout-user', name: 'Avery Stone', role: 'customer' },
      isAuthenticated: true,
      isAdmin: false,
      initializing: false,
      login: vi.fn(),
      logout: vi.fn(),
    }),
  }
})

function seedCheckout({ items, promo } = {}) {
  writeStorage(storageKeys.cart, items ?? [])
  if (promo) writeStorage(storageKeys.promo, promo)
}

async function fillCheckout(user, overrides = {}) {
  const values = {
    'First name': 'Avery',
    'Last name': 'Stone',
    'Email address': 'avery@example.com',
    'Phone number': '5551234567',
    'Address line 1': '12 Market Street',
    City: 'Portland',
    'State or region': 'Oregon',
    'Postal code': '97205',
    'Cardholder name': 'Avery Stone',
    'Card number': '4242 4242 4242 4242',
    'Expiry date (MM/YY)': '12/40',
    'Security code (CVC)': '123',
    ...overrides,
  }

  for (const [label, value] of Object.entries(values)) {
    const field = screen.getByLabelText(label)
    await user.clear(field)
    await user.type(field, value)
  }
}

describe('Checkout page', () => {
  it('redirects to the cart when the cart is empty', () => {
    renderApp(['/checkout'])

    expect(
      screen.getByRole('heading', { name: 'Your cart' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Checkout' }),
    ).not.toBeInTheDocument()
  })

  it('renders the checkout form, demo payment notice, and cart totals', () => {
    seedCheckout({
      items: [
        { productId: 'aero-headphones', quantity: 1 },
        { productId: 'flow-yoga-mat', quantity: 1 },
      ],
      promo: 'WARM20',
    })
    renderApp(['/checkout'])

    expect(
      screen.getByRole('heading', { name: 'Checkout' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Contact details' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Shipping address' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Delivery method' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Demo payment' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/do not enter real card details/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/test mode/i)).toBeInTheDocument()

    const summary = screen.getByRole('complementary', {
      name: /order summary/i,
    })
    expect(within(summary).getByText('Discount (WARM20)')).toBeInTheDocument()
    expect(within(summary).getByText('-$34.20')).toBeInTheDocument()
    expect(within(summary).getByText('Free')).toBeInTheDocument()
    expect(within(summary).getByText('$136.80')).toBeInTheDocument()
    expect(
      within(summary).getByRole('link', { name: /back to cart/i }),
    ).toHaveAttribute('href', '/cart')
  })

  it('blocks submission when required fields are empty', async () => {
    const user = userEvent.setup()
    seedCheckout({
      items: [{ productId: 'aero-headphones', quantity: 1 }],
    })
    renderApp(['/checkout'])

    await user.click(screen.getByRole('button', { name: /place order/i }))

    expect(screen.getByText('First name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email address is required.')).toBeInTheDocument()
    expect(screen.getByText('Address line 1 is required.')).toBeInTheDocument()
    expect(screen.getByText('Card number is required.')).toBeInTheDocument()
    expect(
      screen.getByText('Security code is required.'),
    ).toBeInTheDocument()
    expect(readStorage(storageKeys.orders, [])).toHaveLength(0)
    expect(readStorage(storageKeys.cart, [])).toHaveLength(1)
  })

  it('validates email and payment details', async () => {
    const user = userEvent.setup()
    seedCheckout({
      items: [{ productId: 'aero-headphones', quantity: 1 }],
    })
    renderApp(['/checkout'])

    await fillCheckout(user, {
      'Email address': 'not-an-email',
      'Phone number': 'abc',
      'Card number': '1234 5678',
      'Expiry date (MM/YY)': '01/20',
      'Security code (CVC)': '1',
    })
    await user.click(screen.getByRole('button', { name: /place order/i }))

    expect(
      screen.getByText('Enter a valid email address.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Enter a valid phone number.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Enter a valid card number.')).toBeInTheDocument()
    expect(
      screen.getByText('Enter a valid expiry date (MM/YY).'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Enter a valid security code.'),
    ).toBeInTheDocument()
    expect(readStorage(storageKeys.orders, [])).toHaveLength(0)
  })

  it('creates an order with items, totals, address, status, and safe payment data', async () => {
    const user = userEvent.setup()
    seedCheckout({
      items: [
        { productId: 'aero-headphones', quantity: 1 },
        { productId: 'flow-yoga-mat', quantity: 1 },
      ],
      promo: 'WARM20',
    })
    renderApp(['/checkout'])

    await fillCheckout(user)
    await user.click(screen.getByRole('button', { name: /place order/i }))

    const orders = readStorage(storageKeys.orders, [])
    expect(orders).toHaveLength(1)

    const [order] = orders
    expect(order.id).toMatch(/^order_/)
    expect(order.status).toBe('Confirmed')
    expect(order.contact).toMatchObject({
      firstName: 'Avery',
      lastName: 'Stone',
      email: 'avery@example.com',
      phone: '5551234567',
    })
    expect(order.shippingAddress).toMatchObject({
      address1: '12 Market Street',
      city: 'Portland',
      region: 'Oregon',
      postalCode: '97205',
      country: 'United States',
    })
    expect(order.items).toHaveLength(2)
    expect(order.items.map((item) => item.productId)).toEqual([
      'aero-headphones',
      'flow-yoga-mat',
    ])
    expect(order.promo).toBe('WARM20')
    expect(order.subtotal).toBe(171)
    expect(order.discount).toBe(34.2)
    expect(order.shipping).toBe(0)
    expect(order.total).toBe(136.8)
    expect(order.payment).toEqual({ brand: 'Visa', last4: '4242' })

    const serialized = JSON.stringify(order)
    expect(serialized).not.toContain('4242 4242 4242 4242')
    expect(serialized).not.toContain('4242424242424242')
    expect(serialized).not.toContain('"cvc"')
    expect(serialized).not.toContain('"cardNumber"')

    expect(
      screen.getByRole('heading', { name: 'Order confirmed' }),
    ).toBeInTheDocument()
    expect(screen.getByText(order.id)).toBeInTheDocument()
    expect(screen.getByText('$136.80')).toBeInTheDocument()
    expect(screen.getByText('12 Market Street')).toBeInTheDocument()
  })

  it('clears the cart and promo after placing the order', async () => {
    const user = userEvent.setup()
    seedCheckout({
      items: [{ productId: 'aero-headphones', quantity: 1 }],
      promo: 'WARM20',
    })
    renderApp(['/checkout'])

    await fillCheckout(user)
    await user.click(screen.getByRole('button', { name: /place order/i }))

    expect(readStorage(storageKeys.cart, [])).toEqual([])
    expect(readStorage(storageKeys.promo, null)).toBeNull()
    expect(
      screen.getByRole('button', {
        name: /shopping cart with 0 items/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Order confirmed' }),
    ).toBeInTheDocument()
  })

  it('records standard shipping below the free-shipping threshold', async () => {
    const user = userEvent.setup()
    seedCheckout({
      items: [{ productId: 'flow-yoga-mat', quantity: 1 }],
    })
    renderApp(['/checkout'])

    const summary = screen.getByRole('complementary', {
      name: /order summary/i,
    })
    expect(within(summary).getByText('$6.95')).toBeInTheDocument()
    expect(within(summary).getByText('$48.95')).toBeInTheDocument()

    await fillCheckout(user)
    await user.click(screen.getByRole('button', { name: /place order/i }))

    const [order] = readStorage(storageKeys.orders, [])
    expect(order.subtotal).toBe(42)
    expect(order.discount).toBe(0)
    expect(order.shipping).toBe(6.95)
    expect(order.total).toBe(48.95)
    expect(order.delivery.id).toBe('standard')
    expect(screen.getByText('$48.95')).toBeInTheDocument()
  })

  it('applies the express delivery surcharge to the order total', async () => {
    const user = userEvent.setup()
    seedCheckout({
      items: [
        { productId: 'aero-headphones', quantity: 1 },
        { productId: 'flow-yoga-mat', quantity: 1 },
      ],
    })
    renderApp(['/checkout'])

    await user.click(
      screen.getByRole('radio', { name: /express delivery/i }),
    )

    const summary = screen.getByRole('complementary', {
      name: /order summary/i,
    })
    expect(within(summary).getByText('$12.95')).toBeInTheDocument()
    expect(within(summary).getByText('$183.95')).toBeInTheDocument()

    await fillCheckout(user)
    await user.click(screen.getByRole('button', { name: /place order/i }))

    const [order] = readStorage(storageKeys.orders, [])
    expect(order.delivery.id).toBe('express')
    expect(order.shipping).toBe(12.95)
    expect(order.total).toBe(183.95)
    expect(screen.getByText('$183.95')).toBeInTheDocument()
  })

  it('shows a fallback for an unknown order confirmation', () => {
    renderApp(['/order-confirmation/order_missing'])

    expect(
      screen.getByRole('heading', { name: 'Order not found' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /continue shopping/i }),
    ).toHaveAttribute('href', '/shop')
  })
})
