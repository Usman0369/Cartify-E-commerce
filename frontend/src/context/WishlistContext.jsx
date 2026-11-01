import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuth } from './AuthContext.jsx'
import { useToast } from './ToastContext.jsx'
import { api, apiEnabled } from '../services/api.js'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { isAuthenticated, initializing } = useAuth()
  const { showToast } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!apiEnabled || initializing) return undefined

    if (!isAuthenticated) {
      setItems([])
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)

    api
      .get('/wishlist')
      .then((data) => {
        if (!cancelled) setItems(data?.items ?? [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, initializing])

  const isWishlisted = useCallback(
    (productId) => items.some((item) => item.id === productId),
    [items],
  )

  const toggle = useCallback(
    async (product) => {
      if (!product?.id) return false

      if (!isAuthenticated) {
        showToast('Sign in to save items to your wishlist.')
        return false
      }

      const saved = items.some((item) => item.id === product.id)

      try {
        if (saved) {
          await api.delete(`/wishlist/${product.id}`)
          setItems((current) =>
            current.filter((item) => item.id !== product.id),
          )
          showToast(`${product.name} removed from your wishlist.`)
        } else {
          await api.post(`/wishlist/${product.id}`)
          setItems((current) =>
            current.some((item) => item.id === product.id)
              ? current
              : [...current, product],
          )
          showToast(`${product.name} saved to your wishlist.`)
        }
        return !saved
      } catch (error) {
        showToast(error.message)
        return saved
      }
    },
    [isAuthenticated, items, showToast],
  )

  const value = useMemo(
    () => ({
      items,
      loading,
      isWishlisted,
      toggle,
    }),
    [items, loading, isWishlisted, toggle],
  )

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used inside a WishlistProvider')
  }
  return context
}
