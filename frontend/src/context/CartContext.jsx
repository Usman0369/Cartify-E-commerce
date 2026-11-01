import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAuth } from './AuthContext.jsx'
import { useCatalog } from './CatalogContext.jsx'
import { api, apiEnabled } from '../services/api.js'
import {
  readStorage,
  removeStorage,
  storageKeys,
  writeStorage,
} from '../services/storage.js'

const CartContext = createContext(null)

export const FREE_SHIPPING_THRESHOLD = 75
export const STANDARD_SHIPPING_RATE = 6.95
export const PROMO_CODE = 'WARM20'
export const PROMO_DISCOUNT_RATE = 0.2

function roundMoney(value) {
  return Math.round(value * 100) / 100
}

function sanitizeItems(value) {
  if (!Array.isArray(value)) return []

  return value
    .filter(
      (item) =>
        item &&
        typeof item.productId === 'string' &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0,
    )
    .map((item) => ({
      productId: item.productId,
      quantity: Math.max(1, Math.floor(item.quantity)),
    }))
}

function fromServerCart(cart) {
  return sanitizeItems(cart?.items)
}

export function CartProvider({ children }) {
  const { products } = useCatalog()
  const { user, isAuthenticated, initializing } = useAuth()
  const [items, setItems] = useState(() =>
    sanitizeItems(readStorage(storageKeys.cart, [])),
  )
  const [promo, setPromo] = useState(() => {
    const stored = readStorage(storageKeys.promo, null)
    return typeof stored === 'string' && stored.toUpperCase() === PROMO_CODE
      ? PROMO_CODE
      : null
  })
  const [ownerId, setOwnerId] = useState(() =>
    readStorage(storageKeys.cartOwner, null),
  )
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    writeStorage(storageKeys.cart, items)
  }, [items])

  useEffect(() => {
    if (promo) writeStorage(storageKeys.promo, promo)
    else removeStorage(storageKeys.promo)
  }, [promo])

  useEffect(() => {
    if (initializing) return
    if (!isAuthenticated && ownerId) {
      setItems([])
      setPromo(null)
      setOwnerId(null)
      removeStorage(storageKeys.cartOwner)
    }
  }, [initializing, isAuthenticated, ownerId])

  useEffect(() => {
    if (!apiEnabled || initializing || !isAuthenticated || !user?.id) {
      return undefined
    }

    let cancelled = false

    if (ownerId === user.id) {
      api
        .get('/cart')
        .then((data) => {
          if (!cancelled) setItems(fromServerCart(data?.cart))
        })
        .catch(() => {})
      return () => {
        cancelled = true
      }
    }

    api
      .post('/auth/cart/merge', { items: itemsRef.current })
      .then((data) => {
        if (cancelled) return
        setItems(fromServerCart(data?.cart))
        setOwnerId(user.id)
        writeStorage(storageKeys.cartOwner, user.id)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [initializing, isAuthenticated, user?.id, ownerId])

  const applyServerCart = useCallback((data) => {
    if (data?.cart) setItems(fromServerCart(data.cart))
  }, [])

  const runRemote = useCallback(
    (request) => {
      if (!apiEnabled || !isAuthenticated) return
      request().then(applyServerCart).catch(() => {})
    },
    [isAuthenticated, applyServerCart],
  )

  const addItem = useCallback(
    (product, quantity = 1) => {
      if (!product?.id) return

      const amount = Math.max(1, Math.floor(quantity) || 1)
      const max = Number.isFinite(product.stock) ? product.stock : Infinity

      setItems((current) => {
        const existing = current.find((item) => item.productId === product.id)

        if (existing) {
          return current.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: Math.min(max, item.quantity + amount),
                }
              : item,
          )
        }

        return [
          ...current,
          { productId: product.id, quantity: Math.min(max, amount) },
        ]
      })

      runRemote(() =>
        api.post('/cart', { productId: product.id, quantity: amount }),
      )
    },
    [runRemote],
  )

  const updateQuantity = useCallback(
    (productId, quantity) => {
      const nextQuantity = Math.floor(quantity)

      if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
        setItems((current) =>
          current.filter((item) => item.productId !== productId),
        )
        runRemote(() => api.delete(`/cart/${productId}`))
        return
      }

      setItems((current) =>
        current.map((item) => {
          if (item.productId !== productId) return item
          const product = products.find((entry) => entry.id === productId)
          const max = Number.isFinite(product?.stock) ? product.stock : Infinity
          return { ...item, quantity: Math.min(max, nextQuantity) }
        }),
      )

      runRemote(() =>
        api.patch(`/cart/${productId}`, { quantity: nextQuantity }),
      )
    },
    [products, runRemote],
  )

  const removeItem = useCallback(
    (productId) => {
      setItems((current) =>
        current.filter((item) => item.productId !== productId),
      )
      runRemote(() => api.delete(`/cart/${productId}`))
    },
    [runRemote],
  )

  const applyPromo = useCallback((code) => {
    const normalized = String(code ?? '').trim().toUpperCase()

    if (normalized !== PROMO_CODE) return false

    setPromo(PROMO_CODE)
    return true
  }, [])

  const removePromo = useCallback(() => setPromo(null), [])

  const clearCart = useCallback(() => {
    setItems([])
    setPromo(null)
    runRemote(() => api.delete('/cart'))
  }, [runRemote])

  const cartItems = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find((entry) => entry.id === item.productId)
          if (!product) return null
          return {
            ...item,
            product,
            lineTotal: product.price * item.quantity,
          }
        })
        .filter(Boolean),
    [items, products],
  )

  const count = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  )

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.lineTotal, 0),
    [cartItems],
  )

  const discount = useMemo(
    () => (promo ? roundMoney(subtotal * PROMO_DISCOUNT_RATE) : 0),
    [promo, subtotal],
  )

  const shipping = useMemo(() => {
    if (subtotal === 0) return 0
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_RATE
  }, [subtotal])

  const total = useMemo(
    () => Math.max(0, roundMoney(subtotal - discount + shipping)),
    [discount, shipping, subtotal],
  )

  const amountToFreeShipping = useMemo(
    () => Math.max(0, roundMoney(FREE_SHIPPING_THRESHOLD - subtotal)),
    [subtotal],
  )

  const value = useMemo(
    () => ({
      cartItems,
      count,
      subtotal,
      discount,
      shipping,
      total,
      amountToFreeShipping,
      promo,
      isEmpty: cartItems.length === 0,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      applyPromo,
      removePromo,
    }),
    [
      cartItems,
      count,
      subtotal,
      discount,
      shipping,
      total,
      amountToFreeShipping,
      promo,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      applyPromo,
      removePromo,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used inside a CartProvider')
  }
  return context
}
