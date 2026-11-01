import { Router } from 'express'
import {
  createCategory,
  createCoupon,
  createProduct,
  dashboard,
  deleteCategory,
  deleteCoupon,
  deleteProduct,
  deleteReview,
  getOrder,
  getUser,
  listActivity,
  listCategories,
  listCoupons,
  listOrders,
  listProducts,
  listReviews,
  listUsers,
  setOrderStatus,
  setReviewStatus,
  updateCategory,
  updateCoupon,
  updateProduct,
  updateUser,
} from '../controllers/adminController.js'
import { protect } from '../middleware/auth.js'
import { authorize } from '../middleware/roles.js'
import { writeLimiter } from '../middleware/rateLimits.js'
import { validate } from '../middleware/validate.js'
import {
  adminOrderQuerySchema,
  adminProductQuerySchema,
  adminReviewQuerySchema,
  updateUserSchema,
} from '../validators/admin.js'
import { adminListQuerySchema } from '../validators/catalog.js'
import {
  createCategorySchema,
  createCouponSchema,
  createProductSchema,
  updateCategorySchema,
  updateCouponSchema,
  updateProductSchema,
} from '../validators/catalog.js'
import { orderStatusSchema } from '../validators/order.js'
import { reviewStatusSchema } from '../validators/review.js'

export const adminRouter = Router()

adminRouter.use(protect, authorize('admin'))

adminRouter.get('/dashboard', dashboard)

adminRouter.get('/users', validate(adminListQuerySchema, 'query'), listUsers)
adminRouter.get('/users/:userId', getUser)
adminRouter.patch('/users/:userId', writeLimiter, validate(updateUserSchema), updateUser)

adminRouter.get('/orders', validate(adminOrderQuerySchema, 'query'), listOrders)
adminRouter.get('/orders/:publicId', getOrder)
adminRouter.patch(
  '/orders/:publicId/status',
  writeLimiter,
  validate(orderStatusSchema),
  setOrderStatus,
)

adminRouter.get('/products', validate(adminProductQuerySchema, 'query'), listProducts)
adminRouter.post('/products', writeLimiter, validate(createProductSchema), createProduct)
adminRouter.patch(
  '/products/:productId',
  writeLimiter,
  validate(updateProductSchema),
  updateProduct,
)
adminRouter.delete('/products/:productId', writeLimiter, deleteProduct)

adminRouter.get('/categories', listCategories)
adminRouter.post('/categories', writeLimiter, validate(createCategorySchema), createCategory)
adminRouter.patch(
  '/categories/:categoryId',
  writeLimiter,
  validate(updateCategorySchema),
  updateCategory,
)
adminRouter.delete('/categories/:categoryId', writeLimiter, deleteCategory)

adminRouter.get('/coupons', listCoupons)
adminRouter.post('/coupons', writeLimiter, validate(createCouponSchema), createCoupon)
adminRouter.patch(
  '/coupons/:couponId',
  writeLimiter,
  validate(updateCouponSchema),
  updateCoupon,
)
adminRouter.delete('/coupons/:couponId', writeLimiter, deleteCoupon)

adminRouter.get('/reviews', validate(adminReviewQuerySchema, 'query'), listReviews)
adminRouter.patch(
  '/reviews/:reviewId/status',
  writeLimiter,
  validate(reviewStatusSchema),
  setReviewStatus,
)
adminRouter.delete('/reviews/:reviewId', writeLimiter, deleteReview)

adminRouter.get('/activity', listActivity)
