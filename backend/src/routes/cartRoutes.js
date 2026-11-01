import { Router } from 'express'
import {
  addItem,
  emptyCart,
  getMyCart,
  removeItem,
  updateItem,
} from '../controllers/cartController.js'
import { protect } from '../middleware/auth.js'
import { writeLimiter } from '../middleware/rateLimits.js'
import { validate } from '../middleware/validate.js'
import { addCartItemSchema, updateCartItemSchema } from '../validators/cart.js'

export const cartRouter = Router()

cartRouter.use(protect)

cartRouter.get('/', getMyCart)
cartRouter.post('/', writeLimiter, validate(addCartItemSchema), addItem)
cartRouter.patch(
  '/:productId',
  writeLimiter,
  validate(updateCartItemSchema),
  updateItem,
)
cartRouter.delete('/:productId', writeLimiter, removeItem)
cartRouter.delete('/', writeLimiter, emptyCart)
