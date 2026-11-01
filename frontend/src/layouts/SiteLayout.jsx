import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer.jsx'
import Navbar from '../components/Navbar.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useSearch } from '../context/SearchContext.jsx'

function SiteLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { count } = useCart()
  const { searchTerm, setSearchTerm, submitSearch } = useSearch()

  useEffect(() => {
    if (location.hash) {
      const frame = window.requestAnimationFrame(() => {
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      return () => window.cancelAnimationFrame(frame)
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    return undefined
  }, [location.pathname, location.hash])

  const handleCartClick = () => navigate('/cart')

  return (
    <div className="page">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <Navbar
        cartCount={count}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={submitSearch}
        onCartClick={handleCartClick}
      />

      <main id="main-content">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

export default SiteLayout
