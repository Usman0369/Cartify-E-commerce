import { Product } from '../models/Product.js'
import {
  getProduct,
  listCategories,
  listProducts,
} from '../services/productService.js'
import { sendSuccess } from '../utils/response.js'
import {
  serializeCategory,
  serializeProduct,
} from '../utils/serializers.js'

export async function getProducts(req, res, next) {
  try {
    const result = await listProducts(req.query)
    return sendSuccess(res, {
      products: result.products.map(serializeProduct),
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total,
      },
    })
  } catch (error) {
    return next(error)
  }
}

export async function getProductByReference(req, res, next) {
  try {
    const product = await getProduct(req.params.reference)
    return sendSuccess(res, { product: serializeProduct(product) })
  } catch (error) {
    return next(error)
  }
}

export async function getCategories(req, res, next) {
  try {
    const categories = await listCategories({ includeCounts: true })
    return sendSuccess(res, {
      categories: categories.map((entry) =>
        serializeCategory(entry.category, entry.productCount),
      ),
    })
  } catch (error) {
    return next(error)
  }
}

export async function getBrands(_req, res, next) {
  try {
    const brands = await Product.distinct('brand', { active: true })
    return sendSuccess(res, { brands: brands.sort() })
  } catch (error) {
    return next(error)
  }
}
