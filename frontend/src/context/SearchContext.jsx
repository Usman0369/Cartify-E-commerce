import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const SearchContext = createContext(null)

export function SearchProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const submitSearch = useCallback(() => {
    const query = searchTerm.trim()

    if (location.pathname === '/') {
      document.getElementById('shop')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      return
    }

    if (location.pathname === '/shop') {
      const params = new URLSearchParams(location.search)
      if (query) params.set('q', query)
      else params.delete('q')
      const search = params.toString()
      navigate({ pathname: '/shop', search: search ? `?${search}` : '' })
      return
    }

    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop')
  }, [location.pathname, location.search, navigate, searchTerm])

  const value = useMemo(
    () => ({
      searchTerm,
      setSearchTerm,
      submitSearch,
      clearSearch: () => setSearchTerm(''),
    }),
    [searchTerm, submitSearch],
  )

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used inside a SearchProvider')
  }
  return context
}
