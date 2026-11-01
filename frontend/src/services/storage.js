const prefix = 'cartify'

export const storageKeys = {
  cart: 'cart:v1',
  cartOwner: 'cart:owner:v1',
  promo: 'promo:v1',
  users: 'users:v1',
  session: 'session:v1',
  orders: 'orders:v1',
  orderAccess: 'orders:access:v1',
}

function getKey(key) {
  return `${prefix}:${key}`
}

export function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(getKey(key))
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(getKey(key), JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeStorage(key) {
  try {
    window.localStorage.removeItem(getKey(key))
    return true
  } catch {
    return false
  }
}
