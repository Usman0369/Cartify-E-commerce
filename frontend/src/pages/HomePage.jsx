import { useMemo, useState } from 'react'
import Benefits from '../components/Benefits.jsx'
import BestSellers from '../components/BestSellers.jsx'
import Categories from '../components/Categories.jsx'
import FeaturedProducts from '../components/FeaturedProducts.jsx'
import Hero from '../components/Hero.jsx'
import Newsletter from '../components/Newsletter.jsx'
import PromoBanner from '../components/PromoBanner.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'
import { useSearch } from '../context/SearchContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const { bestSellers, categories, featuredProducts, products } = useCatalog()
  const { searchTerm, setSearchTerm } = useSearch()
  const { addItem } = useCart()
  const { showToast } = useToast()

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const handleAddToCart = (product) => {
    addItem(product)
    showToast(`${product.name} added to cart.`)
  }

  const selectCategory = (category) => {
    setActiveCategory(category)
    setSearchTerm('')
  }

  const browseCategory = (category) => {
    selectCategory(category)
    scrollToSection('shop')
  }

  const handleSearchChange = (value) => {
    setSearchTerm(value)
    if (value.trim()) setActiveCategory('All')
  }

  const handleShopClick = () => {
    scrollToSection('shop')
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setActiveCategory('All')
  }

  const visibleProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const isFiltering = Boolean(query) || activeCategory !== 'All'
    const base = isFiltering ? products : featuredProducts

    return base.filter((product) => {
      const matchesCategory =
        activeCategory === 'All' || product.category === activeCategory
      const matchesSearch =
        !query ||
        [product.name, product.category, product.description].some((value) =>
          value.toLowerCase().includes(query),
        )

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, featuredProducts, products, searchTerm])

  return (
    <>
      <Hero
        onShopClick={handleShopClick}
        onCategoriesClick={() => scrollToSection('categories')}
      />

      <Categories
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={browseCategory}
      />

      <FeaturedProducts
        products={visibleProducts}
        categories={categories}
        activeCategory={activeCategory}
        searchTerm={searchTerm}
        onSelectCategory={selectCategory}
        onAddToCart={handleAddToCart}
        onClearFilters={handleClearFilters}
      />

      <BestSellers products={bestSellers} onAddToCart={handleAddToCart} />

      <PromoBanner onShopClick={handleShopClick} />

      <Benefits />

      <Newsletter />
    </>
  )
}

export default HomePage
