import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderWithProviders.jsx'

describe('routing', () => {
  it('renders the homepage at /', () => {
    renderApp(['/'])

    expect(
      screen.getByRole('heading', {
        name: /everyday essentials/i,
      }),
    ).toBeInTheDocument()
  })

  it('renders the not-found page for unknown routes', () => {
    renderApp(['/not-a-real-page'])

    expect(
      screen.getByRole('heading', { name: /this page has wandered off/i }),
    ).toBeInTheDocument()
  })
})
