import { createId } from '../utils/id.js'
import { readStorage, storageKeys, writeStorage } from './storage.js'

export function readOrders() {
  const stored = readStorage(storageKeys.orders, [])
  if (!Array.isArray(stored)) return []

  return stored.filter((order) => order && typeof order.id === 'string')
}

export function saveOrder(order, { guestAccessToken } = {}) {
  if (!order?.id) return false

  if (guestAccessToken) {
    const access = readStorage(storageKeys.orderAccess, {})
    writeStorage(storageKeys.orderAccess, {
      ...(access && typeof access === 'object' ? access : {}),
      [order.id]: {
        token: guestAccessToken,
        email: order.contact?.email ?? '',
      },
    })
  }

  const remaining = readOrders().filter((entry) => entry.id !== order.id)
  return writeStorage(storageKeys.orders, [order, ...remaining])
}

export function getOrderAccess(id) {
  if (!id) return null
  const access = readStorage(storageKeys.orderAccess, {})
  const entry = access && typeof access === 'object' ? access[id] : null
  return entry?.token ? entry : null
}

export function createOrder(draft = {}) {
  const order = {
    id: createId('order'),
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
    ...draft,
  }

  saveOrder(order)
  return order
}

export function getOrder(id) {
  if (!id) return null
  return readOrders().find((order) => order.id === id) ?? null
}
