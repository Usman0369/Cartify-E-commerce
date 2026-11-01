import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

window.scrollTo = vi.fn()
Element.prototype.scrollIntoView = vi.fn()

window.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

globalThis.requestAnimationFrame = (callback) => {
  callback(0)
  return 0
}

globalThis.cancelAnimationFrame = () => {}

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.clearAllMocks()
})
