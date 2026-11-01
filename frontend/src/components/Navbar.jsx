import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  CartIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from './Icons.jsx'
import './Navbar.css'

const navLinks = [
  { label: 'Home', to: '/', end: true },
  { label: 'Shop', to: '/shop' },
  { label: 'Categories', to: '/categories' },
  { label: 'Best Sellers', to: '/best-sellers' },
  { label: 'Contact', to: '/contact' },
]

function Navbar({
  cartCount,
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  onCartClick,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!menuOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.classList.add('no-scroll')

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('no-scroll')
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    closeMenu()
    onSearchSubmit()
  }

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link
          className="brand"
          to="/"
          aria-label="Cartify home"
          onClick={closeMenu}
        >
          <span className="brand__mark" aria-hidden="true">
            C
          </span>
          <span className="brand__name">Cartify</span>
        </Link>

        <nav className="navbar__links" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `navbar__link${isActive ? ' is-active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <form className="navbar__search" role="search" onSubmit={handleSubmit}>
          <button
            type="submit"
            className="navbar__search-submit"
            aria-label="Search products"
          >
            <SearchIcon />
          </button>
          <label className="sr-only" htmlFor="site-search">
            Search products
          </label>
          <input
            id="site-search"
            className="navbar__search-input"
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search products..."
            autoComplete="off"
          />
          {searchTerm && (
            <button
              type="button"
              className="navbar__search-clear"
              aria-label="Clear search"
              onClick={() => onSearchChange('')}
            >
              <CloseIcon />
            </button>
          )}
        </form>

        <div className="navbar__actions">
          <Link
            className="navbar__account"
            to={user ? '/account' : '/login'}
            aria-label={user ? 'Your account' : 'Sign in'}
            title={user ? 'Your account' : 'Sign in'}
          >
            <UserIcon />
            <span>{user ? user.name.split(' ')[0] : 'Sign in'}</span>
          </Link>

          <button
            type="button"
            className="navbar__cart"
            aria-label={`Shopping cart with ${cartCount} ${
              cartCount === 1 ? 'item' : 'items'
            }`}
            onClick={onCartClick}
          >
            <CartIcon />
            <span className="navbar__cart-label">Cart</span>
            <span className="navbar__cart-count" aria-hidden="true">
              {cartCount}
            </span>
          </button>

          <button
            type="button"
            className="navbar__menu-button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`navbar__mobile ${menuOpen ? 'is-open' : ''}`}
      >
        <nav className="navbar__mobile-links" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `navbar__mobile-link${isActive ? ' is-active' : ''}`
              }
              onClick={closeMenu}
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to={user ? '/account' : '/login'}
            className="navbar__mobile-link"
            onClick={closeMenu}
          >
            {user ? 'My account' : 'Sign in'}
          </NavLink>
        </nav>
        <p className="navbar__mobile-note">
          Free shipping on all orders over $75.
        </p>
      </div>
    </header>
  )
}

export default Navbar
