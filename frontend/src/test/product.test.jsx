import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderWithProviders.jsx'

describe('Product details page', () => {
  it('renders product information from the slug', () => {
    renderApp(['/product/aero-wireless-headphones'])

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /aero wireless headphones/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('$129')).toBeInTheDocument()
    expect(screen.getByText('$159')).toBeInTheDocument()
    expect(screen.getByText(/over-ear comfort with adaptive noise cancelling/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /why you'll love it/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Adaptive noise cancelling')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /specifications/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('40 hours')).toBeInTheDocument()
    expect(screen.getByText('Bluetooth 5.3')).toBeInTheDocument()
    expect(screen.getByText('In stock')).toBeInTheDocument()
  })

  it('links breadcrumbs and brand filters to the shop', () => {
    renderApp(['/product/aero-wireless-headphones'])

    const breadcrumb = screen.getByRole('navigation', {
      name: /breadcrumb/i,
    })

    expect(
      within(breadcrumb).getByRole('link', { name: 'Home' }),
    ).toHaveAttribute('href', '/')
    expect(
      within(breadcrumb).getByRole('link', { name: 'Shop' }),
    ).toHaveAttribute('href', '/shop')
    expect(
      within(breadcrumb).getByRole('link', { name: 'Electronics' }),
    ).toHaveAttribute('href', '/shop?category=Electronics')
    expect(
      within(breadcrumb).getByText('Aero Wireless Headphones'),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      screen.getByRole('link', { name: 'Northline' }),
    ).toHaveAttribute('href', '/shop?brand=Northline')
  })

  it('shows a not-found page for an unknown slug', () => {
    renderApp(['/product/not-a-real-product'])

    expect(
      screen.getByRole('heading', { name: /this page has wandered off/i }),
    ).toBeInTheDocument()
  })

  it('adds the selected quantity to the cart', async () => {
    const user = userEvent.setup()
    renderApp(['/product/aero-wireless-headphones'])

    const quantity = screen.getByLabelText('Quantity')
    expect(quantity).toHaveValue(1)
    expect(
      screen.getByRole('button', { name: /decrease quantity/i }),
    ).toBeDisabled()

    await user.click(
      screen.getByRole('button', { name: /increase quantity/i }),
    )
    await user.click(
      screen.getByRole('button', { name: /increase quantity/i }),
    )

    expect(quantity).toHaveValue(3)

    await user.click(
      screen.getByRole('button', {
        name: /add aero wireless headphones to cart/i,
      }),
    )

    expect(
      screen.getByRole('button', { name: /shopping cart with 3 items/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      /aero wireless headphones added to cart/i,
    )
  })

  it('caps the quantity at the available stock', async () => {
    const user = userEvent.setup()
    renderApp(['/product/haven-lounge-chair'])

    const quantity = screen.getByLabelText('Quantity')
    const increase = screen.getByRole('button', {
      name: /increase quantity/i,
    })

    for (let index = 0; index < 6; index += 1) {
      await user.click(increase)
    }

    expect(quantity).toHaveValue(5)
    expect(increase).toBeDisabled()
    expect(screen.getByText('Only 5 left in stock')).toBeInTheDocument()
  })

  it('lists related products without the current product', () => {
    renderApp(['/product/aero-wireless-headphones'])

    expect(
      screen.getByRole('heading', { name: /you may also like/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /view echo mini speaker/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /view studio slim laptop/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /view lumen mirrorless camera/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', {
        name: /view aero wireless headphones/i,
      }),
    ).not.toBeInTheDocument()
  })

  it('adds a related product to the cart', async () => {
    const user = userEvent.setup()
    renderApp(['/product/aero-wireless-headphones'])

    await user.click(
      screen.getByRole('button', {
        name: /add echo mini speaker to cart/i,
      }),
    )

    expect(
      screen.getByRole('button', { name: /shopping cart with 1 item/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      /echo mini speaker added to cart/i,
    )
  })

  it('opens product details from a shop card', async () => {
    const user = userEvent.setup()
    renderApp(['/shop'])

    await user.click(
      screen.getByRole('link', {
        name: /view aero wireless headphones/i,
      }),
    )

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /aero wireless headphones/i,
      }),
    ).toBeInTheDocument()
  })
})
