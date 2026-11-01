import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  readStorage,
  storageKeys,
  writeStorage,
} from '../services/storage.js'
import { renderApp } from './renderWithProviders.jsx'

function seedCart(items) {
  writeStorage(storageKeys.cart, items)
}

describe('Cart page', () => {
  it('shows the empty-cart state', () => {
    renderApp(['/cart'])

    expect(
      screen.getByRole('heading', { name: 'Your cart' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /your cart is empty/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /continue shopping/i }),
    ).toHaveAttribute('href', '/shop')
    expect(
      screen.getByRole('link', { name: /browse best sellers/i }),
    ).toHaveAttribute('href', '/#best-sellers')
  })

  it('navigates to the cart from the navbar cart button', async () => {
    const user = userEvent.setup()
    renderApp(['/'])

    await user.click(
      screen.getByRole('button', {
        name: /shopping cart with 0 items/i,
      }),
    )

    expect(
      screen.getByRole('heading', { name: 'Your cart' }),
    ).toBeInTheDocument()
  })

  it('shows cart items, subtotal, free shipping, and checkout link', () => {
    seedCart([
      { productId: 'aero-headphones', quantity: 1 },
      { productId: 'flow-yoga-mat', quantity: 1 },
    ])
    renderApp(['/cart'])

    expect(
      screen.getByRole('link', { name: /view aero wireless headphones/i }),
    ).toHaveAttribute('href', '/product/aero-wireless-headphones')
    expect(
      screen.getByRole('link', { name: /view flow yoga mat/i }),
    ).toHaveAttribute('href', '/product/flow-yoga-mat')
    expect(screen.getByText('$129')).toBeInTheDocument()
    expect(screen.getByText('$42')).toBeInTheDocument()

    const summary = screen.getByRole('complementary', {
      name: /order summary/i,
    })
    expect(
      within(summary).getByText(/you have unlocked free shipping/i),
    ).toBeInTheDocument()
    expect(within(summary).getByText('Free')).toBeInTheDocument()
    expect(within(summary).getAllByText('$171')).toHaveLength(2)
    expect(
      screen.getByRole('progressbar', {
        name: /progress toward free shipping/i,
      }),
    ).toHaveAttribute('aria-valuenow', '75')
    expect(
      screen.getByRole('link', { name: /proceed to checkout/i }),
    ).toHaveAttribute('href', '/checkout')
  })

  it('calculates standard shipping below the free-shipping threshold', () => {
    seedCart([{ productId: 'flow-yoga-mat', quantity: 1 }])
    renderApp(['/cart'])

    expect(
      screen.getByText(/you're \$33 away from free shipping/i),
    ).toBeInTheDocument()

    const summary = screen.getByRole('complementary', {
      name: /order summary/i,
    })
    expect(within(summary).getByText('$6.95')).toBeInTheDocument()
    expect(within(summary).getByText('$48.95')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', {
        name: /progress toward free shipping/i,
      }),
    ).toHaveAttribute('aria-valuenow', '42')
  })

  it('applies the WARM20 promo code', async () => {
    const user = userEvent.setup()
    seedCart([{ productId: 'aero-headphones', quantity: 1 }])
    renderApp(['/cart'])

    await user.type(screen.getByLabelText('Promo code'), 'warm20')
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(
      screen.getByText((_, element) =>
        element?.classList.contains('cart__promo-applied'),
      ),
    ).toHaveTextContent('WARM20 applied')
    expect(screen.getByText('Discount (WARM20)')).toBeInTheDocument()
    expect(screen.getByText('-$25.80')).toBeInTheDocument()
    expect(screen.getByText('$103.20')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      /promo code warm20 applied/i,
    )
  })

  it('rejects an invalid promo code', async () => {
    const user = userEvent.setup()
    seedCart([{ productId: 'aero-headphones', quantity: 1 }])
    renderApp(['/cart'])

    await user.type(screen.getByLabelText('Promo code'), 'NOPE')
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      /that promo code is not valid/i,
    )
    expect(screen.queryByText(/discount \(warm20\)/i)).not.toBeInTheDocument()
  })

  it('updates quantity and persists the cart after a remount', async () => {
    const user = userEvent.setup()
    seedCart([{ productId: 'aero-headphones', quantity: 1 }])
    const view = renderApp(['/cart'])

    await user.click(
      screen.getByRole('button', {
        name: /increase quantity for aero wireless headphones/i,
      }),
    )

    expect(
      screen.getByLabelText('Quantity for Aero Wireless Headphones'),
    ).toHaveValue(2)
    expect(
      screen.getByRole('button', { name: /shopping cart with 2 items/i }),
    ).toBeInTheDocument()

    view.unmount()
    renderApp(['/cart'])

    expect(
      screen.getByLabelText('Quantity for Aero Wireless Headphones'),
    ).toHaveValue(2)
    expect(
      screen.getByRole('button', { name: /shopping cart with 2 items/i }),
    ).toBeInTheDocument()
  })

  it('caps quantity at the available stock', async () => {
    const user = userEvent.setup()
    seedCart([{ productId: 'haven-chair', quantity: 4 }])
    renderApp(['/cart'])

    const increase = screen.getByRole('button', {
      name: /increase quantity for haven lounge chair/i,
    })

    await user.click(increase)

    expect(
      screen.getByLabelText('Quantity for Haven Lounge Chair'),
    ).toHaveValue(5)
    expect(increase).toBeDisabled()
  })

  it('removes an item, recalculates totals, and keeps it removed after refresh', async () => {
    const user = userEvent.setup()
    seedCart([
      { productId: 'aero-headphones', quantity: 1 },
      { productId: 'flow-yoga-mat', quantity: 1 },
    ])
    const view = renderApp(['/cart'])

    await user.click(
      screen.getByRole('button', {
        name: /remove aero wireless headphones from cart/i,
      }),
    )

    expect(
      screen.queryByRole('link', { name: /view aero wireless headphones/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /view flow yoga mat/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /shopping cart with 1 item/i }),
    ).toBeInTheDocument()

    const summary = screen.getByRole('complementary', {
      name: /order summary/i,
    })
    expect(within(summary).getByText('$42')).toBeInTheDocument()
    expect(within(summary).getByText('$6.95')).toBeInTheDocument()
    expect(within(summary).getByText('$48.95')).toBeInTheDocument()
    expect(readStorage(storageKeys.cart, [])).toEqual([
      { productId: 'flow-yoga-mat', quantity: 1 },
    ])
    expect(screen.getByRole('status')).toHaveTextContent(
      /aero wireless headphones removed from cart/i,
    )

    view.unmount()
    renderApp(['/cart'])

    expect(
      screen.queryByRole('link', { name: /view aero wireless headphones/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /view flow yoga mat/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /shopping cart with 1 item/i }),
    ).toBeInTheDocument()
  })

  it('shows the empty-cart state after removing the last item', async () => {
    const user = userEvent.setup()
    seedCart([{ productId: 'aero-headphones', quantity: 1 }])
    renderApp(['/cart'])

    await user.click(
      screen.getByRole('button', {
        name: /remove aero wireless headphones from cart/i,
      }),
    )

    expect(
      screen.getByRole('heading', { name: /your cart is empty/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /shopping cart with 0 items/i }),
    ).toBeInTheDocument()
    expect(readStorage(storageKeys.cart, [])).toEqual([])
    expect(screen.getByRole('status')).toHaveTextContent(
      /aero wireless headphones removed from cart/i,
    )
  })

  it('clears the cart', async () => {
    const user = userEvent.setup()
    seedCart([
      { productId: 'aero-headphones', quantity: 1 },
      { productId: 'flow-yoga-mat', quantity: 1 },
    ])
    renderApp(['/cart'])

    await user.click(screen.getByRole('button', { name: /clear cart/i }))

    expect(
      screen.getByRole('heading', { name: /your cart is empty/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /shopping cart with 0 items/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      /your cart has been cleared/i,
    )
  })
})
