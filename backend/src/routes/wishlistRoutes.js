import { Router } from 'express'
import {
  addToWishlist,
  getMyWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController.js'
import { protect } from '../middleware/auth.js'
import { writeLimiter } from '../middleware/rateLimits.js'

export const wishlistRouter = Router()

wishlistRouter.use(protect)

wishlistRouter.get('/', getMyWishlist)
wishlistRouter.post('/:productId', writeLimiter, addToWishlist)
wishlistRouter.delete('/:productId', writeLimiter, removeFromWishlist)
