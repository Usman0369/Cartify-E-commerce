import { Router } from 'express'
import {
  cancelOrder,
  createCheckoutOrder,
  getOrder,
  getOrders,
  lookupGuestOrder,
} from '../controllers/orderController.js'
import { optionalAuth, protect } from '../middleware/auth.js'
import { otpLimiter, writeLimiter } from '../middleware/rateLimits.js'
import { validate } from '../middleware/validate.js'
import {
  createOrderSchema,
  guestOrderLookupSchema,
  orderListQuerySchema,
} from '../validators/order.js'

export const orderRouter = Router()

orderRouter.post(
  '/',
  optionalAuth,
  writeLimiter,
  validate(createOrderSchema),
  createCheckoutOrder,
)
orderRouter.get('/', protect, validate(orderListQuerySchema, 'query'), getOrders)
orderRouter.get('/:publicId', protect, getOrder)
orderRouter.post('/:publicId/cancel', protect, writeLimiter, cancelOrder)
orderRouter.post(
  '/guest/:publicId',
  otpLimiter,
  validate(guestOrderLookupSchema),
  lookupGuestOrder,
)
