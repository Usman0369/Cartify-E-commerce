import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  bestSellers as staticBestSellers,
  brands as staticBrands,
  categories as staticCategories,
  featuredProducts as staticFeatured,
  products as staticProducts,
} from '../data/products.js'
import { api, apiEnabled } from '../services/api.js'

const CatalogContext = createContext(null)

function normalizeProduct(product) {
  return {
    ...product,
    category: product.category || product.categoryId,
  }
}

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState(staticProducts)
  const [categories, setCategories] = useState(staticCategories)
  const [brands, setBrands] = useState(staticBrands)
  const [source, setSource] = useState('static')

  useEffect(() => {
    if (!apiEnabled) return undefined

    let cancelled = false

    Promise.all([
      api.get('/products?limit=100'),
      api.get('/categories'),
      api.get('/brands'),
    ])
      .then(([productData, categoryData, brandData]) => {
        if (cancelled) return
        const nextProducts = (productData?.products ?? []).map(normalizeProduct)
        if (nextProducts.length > 0) {
          setProducts(nextProducts)
          setSource('api')
        }
        if (categoryData?.categories?.length) {
          setCategories(categoryData.categories)
        }
        if (brandData?.brands?.length) {
          setBrands(brandData.brands)
        }
      })
      .catch(() => {
        if (!cancelled) setSource('static')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => {
    const featuredProducts = products.filter((product) => product.featured)
    const bestSellers = products.filter((product) => product.bestSeller)

    return {
      products,
      categories,
      brands,
      featuredProducts:
        featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8),
      bestSellers:
        bestSellers.length > 0 ? bestSellers : staticBestSellers,
      source,
      staticFeatured,
      refreshCatalog: () => {
        if (!apiEnabled) return Promise.resolve()
        return Promise.all([
          api.get('/products?limit=100'),
          api.get('/categories'),
          api.get('/brands'),
        ]).then(([productData, categoryData, brandData]) => {
          setProducts((productData?.products ?? []).map(normalizeProduct))
          setCategories(categoryData?.categories ?? [])
          setBrands(brandData?.brands ?? [])
          setSource('api')
        })
      },
    }
  }, [products, categories, brands, source])

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  )
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) {
    throw new Error('useCatalog must be used inside a CatalogProvider')
  }
  return context
}
