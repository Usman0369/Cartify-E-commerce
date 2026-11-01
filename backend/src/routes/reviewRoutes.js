import { Router } from 'express'
import {
  createReview,
  deleteMyReview,
  listMyReviews,
  listProductReviews,
} from '../controllers/reviewController.js'
import { protect } from '../middleware/auth.js'
import { writeLimiter } from '../middleware/rateLimits.js'
import { validate } from '../middleware/validate.js'
import { createReviewSchema } from '../validators/review.js'
import { z } from 'zod'

export const reviewRouter = Router()

reviewRouter.get(
  '/product/:reference',
  validate(
    z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(10),
    }),
    'query',
  ),
  listProductReviews,
)
reviewRouter.get('/mine', protect, listMyReviews)
reviewRouter.post('/', protect, writeLimiter, validate(createReviewSchema), createReview)
reviewRouter.delete('/:reviewId', protect, writeLimiter, deleteMyReview)
