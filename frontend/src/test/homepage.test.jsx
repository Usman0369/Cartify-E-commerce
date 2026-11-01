import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderWithProviders.jsx'

describe('Cartify homepage', () => {
  it('renders the existing homepage sections', () => {
    renderApp()

    expect(
      screen.getByRole('heading', {
        name: /everyday essentials/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /shop by category/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /featured products/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /best sellers/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /a calmer way to shop/i }),
    ).toBeInTheDocument()
  })

  it('filters products with the live search and clears filters', async () => {
    const user = userEvent.setup()
    renderApp()

    const search = screen.getByRole('searchbox', { name: /search products/i })
    await user.type(search, 'headphones')

    expect(screen.getByText('Aero Wireless Headphones')).toBeInTheDocument()
    expect(screen.queryByText('Haven Lounge Chair')).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'zzzz-no-match')

    expect(
      screen.getByRole('heading', { name: /no pieces found/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /clear filters/i }))

    expect(screen.getByText('Haven Lounge Chair')).toBeInTheDocument()
  })

  it('filters featured products from a category card', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(
      screen.getByRole('button', {
        name: /audio, cameras & everyday tech/i,
      }),
    )

    expect(screen.getByText('Aero Wireless Headphones')).toBeInTheDocument()
    expect(screen.queryByText('Cloudstep Runner')).not.toBeInTheDocument()
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })

  it('adds a product to the cart and shows the toast', async () => {
    const user = userEvent.setup()
    renderApp()

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

  it('keeps cart items after a remount', async () => {
    const user = userEvent.setup()
    const view = renderApp()

    await user.click(
      screen.getByRole('button', {
        name: /add aero wireless headphones to cart/i,
      }),
    )

    view.unmount()
    renderApp()

    expect(
      screen.getByRole('button', { name: /shopping cart with 1 item/i }),
    ).toBeInTheDocument()
  })

  it('validates the newsletter email and shows success', async () => {
    const user = userEvent.setup()
    renderApp()

    const email = screen.getByLabelText(/email address/i)
    await user.type(email, 'not-an-email')
    await user.click(screen.getByRole('button', { name: /subscribe/i }))

    expect(
      screen.getByText(/please enter a valid email address/i),
    ).toBeInTheDocument()

    await user.clear(email)
    await user.type(email, 'hello@example.com')
    await user.click(screen.getByRole('button', { name: /subscribe/i }))

    expect(screen.getByRole('status')).toHaveTextContent(/on the list/i)
  })

  it('opens and closes the mobile menu', async () => {
    const user = userEvent.setup()
    renderApp()

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await user.click(menuButton)

    expect(menuButton).toHaveAttribute('aria-expanded', 'true')

    await user.click(menuButton)

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })
})
