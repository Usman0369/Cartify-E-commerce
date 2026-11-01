import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderWithProviders.jsx'

const addToCartButtons = () =>
  screen.getAllByRole('button', { name: /^add .* to cart$/i })

describe('Shop page', () => {
  it('shows 8 products initially and loads the remaining 4', async () => {
    const user = userEvent.setup()
    renderApp(['/shop'])

    expect(
      screen.getByRole('heading', { name: /shop all products/i }),
    ).toBeInTheDocument()
    expect(addToCartButtons()).toHaveLength(8)

    await user.click(
      screen.getByRole('button', { name: /load more products/i }),
    )

    expect(addToCartButtons()).toHaveLength(12)
    expect(
      screen.queryByRole('button', { name: /load more products/i }),
    ).not.toBeInTheDocument()
  })

  it('resets the visible products when the sort changes', async () => {
    const user = userEvent.setup()
    renderApp(['/shop'])

    await user.click(
      screen.getByRole('button', { name: /load more products/i }),
    )
    expect(addToCartButtons()).toHaveLength(12)

    await user.selectOptions(screen.getByLabelText('Sort by'), 'price-asc')

    expect(addToCartButtons()).toHaveLength(8)
    expect(
      screen.getByRole('button', { name: /load more products/i }),
    ).toBeInTheDocument()
  })

  it('searches by brand', async () => {
    const user = userEvent.setup()
    renderApp(['/shop'])

    await user.type(
      screen.getByRole('searchbox', { name: /search the shop/i }),
      'Northline',
    )

    expect(screen.getByText('Aero Wireless Headphones')).toBeInTheDocument()
    expect(screen.getByText('Echo Mini Speaker')).toBeInTheDocument()
    expect(screen.getByText('Studio Slim Laptop')).toBeInTheDocument()
    expect(screen.queryByText('Flow Yoga Mat')).not.toBeInTheDocument()
  })

  it('filters by category', async () => {
    const user = userEvent.setup()
    renderApp(['/shop'])

    await user.selectOptions(screen.getByLabelText('Category'), 'Electronics')

    expect(screen.getByText('Aero Wireless Headphones')).toBeInTheDocument()
    expect(screen.getByText('Lumen Mirrorless Camera')).toBeInTheDocument()
    expect(screen.getByText('Echo Mini Speaker')).toBeInTheDocument()
    expect(screen.getByText('Studio Slim Laptop')).toBeInTheDocument()
    expect(screen.queryByText('Cloudstep Runner')).not.toBeInTheDocument()
  })

  it('filters by minimum price', async () => {
    const user = userEvent.setup()
    renderApp(['/shop'])

    await user.type(screen.getByLabelText('Min price'), '500')

    expect(screen.getByText('Lumen Mirrorless Camera')).toBeInTheDocument()
    expect(screen.getByText('Studio Slim Laptop')).toBeInTheDocument()
    expect(
      screen.queryByText('Aero Wireless Headphones'),
    ).not.toBeInTheDocument()
  })

  it('sorts products by price', async () => {
    const user = userEvent.setup()
    renderApp(['/shop'])

    await user.selectOptions(screen.getByLabelText('Sort by'), 'price-asc')

    const names = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)

    expect(names[0]).toBe('Flow Yoga Mat')
    expect(names[1]).toBe('Carryall Canvas Tote')
  })

  it('restores filters from the URL', () => {
    renderApp(['/shop?q=yoga'])

    expect(screen.getByText('Flow Yoga Mat')).toBeInTheDocument()
    expect(screen.queryByText('Aero Wireless Headphones')).not.toBeInTheDocument()
    expect(
      screen.getByRole('searchbox', { name: /search the shop/i }),
    ).toHaveValue('yoga')
  })

  it('shows an empty state and clears the filters', async () => {
    const user = userEvent.setup()
    renderApp(['/shop?q=zzzz-no-match'])

    expect(
      screen.getByRole('heading', { name: /no products found/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^clear filters$/i }))

    expect(addToCartButtons()).toHaveLength(8)
  })

  it('adds a shop product to the cart', async () => {
    const user = userEvent.setup()
    renderApp(['/shop'])

    await user.click(
      screen.getByRole('button', {
        name: /add aero wireless headphones to cart/i,
      }),
    )

    expect(
      screen.getByRole('button', { name: /shopping cart with 1 item/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      /aero wireless headphones added to cart/i,
    )
  })

  it('links product cards to the product detail route', () => {
    renderApp(['/shop'])

    expect(
      screen.getByRole('link', { name: /view aero wireless headphones/i }),
    ).toHaveAttribute('href', '/product/aero-wireless-headphones')
  })

  it('keeps homepage product cards free of brand labels', () => {
    renderApp(['/'])

    expect(screen.queryByText('Northline')).not.toBeInTheDocument()
    expect(screen.queryByText('Fieldwork')).not.toBeInTheDocument()
  })

  it('points the navbar Shop link to /shop', () => {
    renderApp(['/'])

    const shopLinks = screen.getAllByRole('link', { name: 'Shop' })
    expect(shopLinks[0]).toHaveAttribute('href', '/shop')
  })
})
