import { describe, expect, it } from 'vitest'
import {
  getOrder,
  getOrderAccess,
  saveOrder,
} from '../services/orders.js'

const order = {
  id: 'order_123',
  status: 'Confirmed',
  contact: { email: 'avery@example.com' },
  items: [],
}

describe('order cache', () => {
  it('stores guest access details without exposing them as order fields', () => {
    saveOrder(order, { guestAccessToken: 'guest-token-1234567890' })

    expect(getOrder(order.id)).toEqual(order)
    expect(getOrderAccess(order.id)).toEqual({
      token: 'guest-token-1234567890',
      email: 'avery@example.com',
    })
    expect(getOrder(order.id)).not.toHaveProperty('guestAccessToken')
  })

  it('keeps guest access when a refreshed order is cached again', () => {
    saveOrder(order, { guestAccessToken: 'guest-token-1234567890' })
    saveOrder({ ...order, status: 'Shipped' })

    expect(getOrder(order.id).status).toBe('Shipped')
    expect(getOrderAccess(order.id)?.token).toBe('guest-token-1234567890')
  })
})
