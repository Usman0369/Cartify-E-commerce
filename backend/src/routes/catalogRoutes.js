import { Router } from 'express'
import {
  getBrands,
  getCategories,
  getProductByReference,
  getProducts,
} from '../controllers/catalogController.js'
import { validate } from '../middleware/validate.js'
import { productQuerySchema } from '../validators/catalog.js'

export const catalogRouter = Router()

catalogRouter.get('/products', validate(productQuerySchema, 'query'), getProducts)
catalogRouter.get('/products/:reference', getProductByReference)
catalogRouter.get('/categories', getCategories)
catalogRouter.get('/brands', getBrands)
