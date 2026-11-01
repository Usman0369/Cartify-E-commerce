import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderWithProviders.jsx'

function primaryNav() {
  return screen.getByRole('navigation', { name: /primary navigation/i })
}

describe('Static navigation pages', () => {
  it('points every primary navigation link at its own route', () => {
    renderApp(['/'])

    const nav = primaryNav()
    const links = [
      ['Home', '/'],
      ['Shop', '/shop'],
      ['Categories', '/categories'],
      ['Best Sellers', '/best-sellers'],
      ['Contact', '/contact'],
    ]

    for (const [name, href] of links) {
      expect(
        within(nav).getByRole('link', { name }),
      ).toHaveAttribute('href', href)
    }
  })

  it('opens the categories page from the navbar without scrolling the homepage', async () => {
    const user = userEvent.setup()
    renderApp(['/'])

    await user.click(
      within(primaryNav()).getByRole('link', { name: 'Categories' }),
    )

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /shop by category/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /everyday essentials/i }),
    ).not.toBeInTheDocument()
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()

    expect(
      screen.getByRole('link', { name: /shop electronics/i }),
    ).toHaveAttribute('href', '/shop?category=Electronics')
    expect(
      screen.getByRole('link', { name: /shop home & living/i }),
    ).toHaveAttribute(
      'href',
      '/shop?category=Home%20%26%20Living',
    )
  })

  it('opens the best sellers page and allows adding a product to the cart', async () => {
    const user = userEvent.setup()
    renderApp(['/best-sellers'])

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Best sellers',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /view the full collection/i }),
    ).toHaveAttribute('href', '/shop')

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

  it('renders the contact page and validates its form', async () => {
    const user = userEvent.setup()
    renderApp(['/contact'])

    expect(
      screen.getByRole('heading', { level: 1, name: 'Contact us' }),
    ).toBeInTheDocument()
    expect(
      within(
        screen.getByRole('complementary', {
          name: /contact information/i,
        }),
      ).getByText('hello@cartify.shop'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /send a message/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(screen.getByText('Please enter your name.')).toBeInTheDocument()
    expect(
      screen.getByText('Email address is required.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Please enter a message.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Full name'), 'Avery Stone')
    await user.type(screen.getByLabelText('Email address'), 'not-an-email')
    await user.type(
      screen.getByLabelText('Message'),
      'I have a question about my recent order.',
    )
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(
      screen.getByText('Enter a valid email address.'),
    ).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Email address'))
    await user.type(screen.getByLabelText('Email address'), 'avery@example.com')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(screen.getByRole('status')).toHaveTextContent(/thanks, avery/i)
    expect(screen.getByRole('status')).toHaveTextContent(
      /avery@example.com/i,
    )
  })

  it('keeps footer navigation pointed at the new pages', () => {
    renderApp(['/'])

    const footer = screen.getByRole('contentinfo')
    expect(
      within(footer).getByRole('link', { name: 'All products' }),
    ).toHaveAttribute('href', '/shop')
    expect(
      within(footer).getByRole('link', { name: 'Categories' }),
    ).toHaveAttribute('href', '/categories')
    expect(
      within(footer).getByRole('link', { name: 'Best sellers' }),
    ).toHaveAttribute('href', '/best-sellers')
    expect(
      within(footer).getByRole('link', { name: 'Contact us' }),
    ).toHaveAttribute('href', '/contact')
  })
})
