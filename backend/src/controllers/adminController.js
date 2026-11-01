import mongoose from 'mongoose'
import { Category } from '../models/Category.js'
import { Coupon } from '../models/Coupon.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { Order } from '../models/Order.js'
import { ActivityLog } from '../models/ActivityLog.js'
import { Review as ReviewModel } from '../models/Review.js'
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from '../utils/ApiError.js'
import { sendCreated, sendSuccess } from '../utils/response.js'
import {
  publicUser,
  serializeCategory,
  serializeOrder,
  serializeProduct,
  serializeReview,
} from '../utils/serializers.js'
import {
  recalculateProductRating,
} from '../services/reviewService.js'
import { updateOrderStatus } from '../services/orderService.js'
import { logActivity } from '../services/activityService.js'
import { revokeAllUserSessions } from '../services/tokenService.js'

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function uniqueProductSlug(name, excludeId = null) {
  const base = slugify(name) || `product-${Date.now()}`
  let candidate = base
  let index = 2

  while (
    await Product.exists({
      $or: [{ slug: candidate }, { catalogId: candidate }],
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    candidate = `${base}-${index}`
    index += 1
  }

  return candidate
}

async function uniqueCategoryCatalogId(name, excludeId = null) {
  const base = slugify(name) || `category-${Date.now()}`
  let candidate = base
  let index = 2

  while (
    await Category.exists({
      catalogId: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    candidate = `${base}-${index}`
    index += 1
  }

  return candidate
}

async function resolveCategory(reference) {
  const or = [{ catalogId: String(reference) }, { name: String(reference) }]
  if (mongoose.isValidObjectId(reference)) or.push({ _id: reference })
  const category = await Category.findOne({ $or: or })
  if (!category) throw badRequest('Choose a valid category.', 'CATEGORY_INVALID')
  return category
}

export async function dashboard(_req, res, next) {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const [
      revenueStats,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingReviews,
      lowStock,
      recentOrders,
      recentActivity,
      monthlySales,
      topProducts,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Refunded'] } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ active: true }),
      ReviewModel.countDocuments({ status: 'pending' }),
      Product.find({ active: true, stock: { $lte: 5 } })
        .sort({ stock: 1 })
        .limit(8),
      Order.find().sort({ createdAt: -1 }).limit(6),
      ActivityLog.find().sort({ createdAt: -1 }).limit(8).populate('actor', 'name email'),
      Order.aggregate([
        {
          $match: {
            status: { $nin: ['Cancelled', 'Refunded'] },
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Refunded'] } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            image: { $first: '$items.image' },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.lineTotal' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
    ])

    return sendSuccess(res, {
      stats: {
        revenue: revenueStats[0]?.total ?? 0,
        paidOrders: revenueStats[0]?.count ?? 0,
        totalOrders,
        totalCustomers,
        totalProducts,
        pendingReviews,
        lowStockCount: lowStock.length,
      },
      lowStock: lowStock.map(serializeProduct),
      recentOrders: recentOrders.map(serializeOrder),
      recentActivity,
      monthlySales,
      topProducts,
    })
  } catch (error) {
    return next(error)
  }
}

export async function listUsers(req, res, next) {
  try {
    const { page, limit, search, role } = req.query
    const filter = {}
    if (role) filter.role = role
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i')
      filter.$or = [{ name: regex }, { email: regex }]
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ])

    return sendSuccess(res, {
      users: users.map(publicUser),
      pagination: { page, pages: Math.ceil(total / limit), total },
    })
  } catch (error) {
    return next(error)
  }
}

export async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.userId)
    if (!user) throw notFound('User not found.', 'USER_NOT_FOUND')

    const orders = await Order.countDocuments({ user: user._id })
    return sendSuccess(res, {
      user: publicUser(user),
      orderCount: orders,
    })
  } catch (error) {
    return next(error)
  }
}

export async function updateUser(req, res, next) {
  try {
    const user = await User.findById(req.params.userId)
    if (!user) throw notFound('User not found.', 'USER_NOT_FOUND')

    if (
      String(user._id) === String(req.user._id) &&
      (req.body.role === 'customer' || req.body.active === false)
    ) {
      throw forbidden(
        'You cannot remove your own admin access or deactivate yourself.',
        'ADMIN_SELF_CHANGE',
      )
    }

    if (req.body.role !== undefined) user.role = req.body.role
    if (req.body.active !== undefined) user.active = req.body.active
    await user.save()

    if (req.body.active === false) {
      await revokeAllUserSessions(user._id)
    }

    await logActivity({
      type: 'admin.user_updated',
      message: `Admin updated account ${user.email}.`,
      actor: req.user._id,
      metadata: { userId: String(user._id) },
    })

    return sendSuccess(res, { user: publicUser(user) }, 200, 'User updated.')
  } catch (error) {
    return next(error)
  }
}

export async function listOrders(req, res, next) {
  try {
    const { page, limit, status, search } = req.query
    const filter = {}
    if (status) filter.status = status
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i')
      filter.$or = [
        { publicId: regex },
        { 'contact.email': regex },
        { 'contact.firstName': regex },
        { 'contact.lastName': regex },
      ]
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ])

    return sendSuccess(res, {
      orders: orders.map(serializeOrder),
      pagination: { page, pages: Math.ceil(total / limit), total },
    })
  } catch (error) {
    return next(error)
  }
}

export async function getOrder(req, res, next) {
  try {
    const order = await Order.findOne({ publicId: req.params.publicId }).populate(
      'user',
      'name email',
    )
    if (!order) throw notFound('Order not found.', 'ORDER_NOT_FOUND')
    return sendSuccess(res, { order: serializeOrder(order) })
  } catch (error) {
    return next(error)
  }
}

export async function setOrderStatus(req, res, next) {
  try {
    const order = await updateOrderStatus(
      req.params.publicId,
      req.body.status,
      req.user._id,
      req.body.note,
    )
    return sendSuccess(res, { order: serializeOrder(order) }, 200, 'Order updated.')
  } catch (error) {
    return next(error)
  }
}

export async function listProducts(req, res, next) {
  try {
    const { page, limit, search, status, category } = req.query
    const filter = {}

    if (status === 'active') filter.active = true
    if (status === 'inactive') filter.active = false
    if (status === 'low-stock') filter.stock = { $lte: 5 }
    if (category) {
      const resolved = await resolveCategory(category)
      filter.category = resolved._id
    }
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i')
      filter.$or = [{ name: regex }, { brand: regex }, { catalogId: regex }]
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ])

    return sendSuccess(res, {
      products: products.map(serializeProduct),
      pagination: { page, pages: Math.ceil(total / limit), total },
    })
  } catch (error) {
    return next(error)
  }
}

export async function createProduct(req, res, next) {
  try {
    const { categoryId, ...data } = req.body
    const category = await resolveCategory(categoryId)
    const slug = await uniqueProductSlug(data.name)

    const product = await Product.create({
      ...data,
      category: category._id,
      slug,
      catalogId: slug,
    })
    await product.populate('category')

    await logActivity({
      type: 'admin.product_created',
      message: `Admin created product ${product.name}.`,
      actor: req.user._id,
      metadata: { productId: String(product._id) },
    })

    return sendCreated(res, { product: serializeProduct(product) })
  } catch (error) {
    return next(error)
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.productId)
    if (!product) throw notFound('Product not found.', 'PRODUCT_NOT_FOUND')

    const { categoryId, ...data } = req.body
    if (categoryId) {
      const category = await resolveCategory(categoryId)
      product.category = category._id
    }

    Object.assign(product, data)
    await product.save()
    await product.populate('category')

    await logActivity({
      type: 'admin.product_updated',
      message: `Admin updated product ${product.name}.`,
      actor: req.user._id,
      metadata: { productId: String(product._id) },
    })

    return sendSuccess(res, { product: serializeProduct(product) }, 200, 'Product updated.')
  } catch (error) {
    return next(error)
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { $set: { active: false } },
      { new: true },
    )
    if (!product) throw notFound('Product not found.', 'PRODUCT_NOT_FOUND')

    await logActivity({
      type: 'admin.product_deleted',
      message: `Admin archived product ${product.name}.`,
      actor: req.user._id,
      metadata: { productId: String(product._id) },
    })

    return sendSuccess(res, null, 200, 'Product archived.')
  } catch (error) {
    return next(error)
  }
}

export async function listCategories(_req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 })
    const counts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ])
    const countMap = new Map(counts.map((entry) => [String(entry._id), entry.count]))

    return sendSuccess(res, {
      categories: categories.map((category) =>
        serializeCategory(category, countMap.get(String(category._id)) ?? 0),
      ),
    })
  } catch (error) {
    return next(error)
  }
}

export async function createCategory(req, res, next) {
  try {
    const catalogId = await uniqueCategoryCatalogId(req.body.name)
    const category = await Category.create({ ...req.body, catalogId })
    return sendCreated(res, { category: serializeCategory(category, 0) })
  } catch (error) {
    return next(error)
  }
}

export async function updateCategory(req, res, next) {
  try {
    const category = await Category.findById(req.params.categoryId)
    if (!category) throw notFound('Category not found.', 'CATEGORY_NOT_FOUND')

    Object.assign(category, req.body)
    await category.save()
    return sendSuccess(res, { category: serializeCategory(category) }, 200, 'Category updated.')
  } catch (error) {
    return next(error)
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const productCount = await Product.countDocuments({
      category: req.params.categoryId,
    })
    if (productCount > 0) {
      throw conflict(
        'Move or archive this category’s products before deleting it.',
        'CATEGORY_IN_USE',
      )
    }

    const category = await Category.findByIdAndDelete(req.params.categoryId)
    if (!category) throw notFound('Category not found.', 'CATEGORY_NOT_FOUND')
    return sendSuccess(res, null, 200, 'Category deleted.')
  } catch (error) {
    return next(error)
  }
}

export async function listCoupons(_req, res, next) {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 })
    return sendSuccess(res, { coupons })
  } catch (error) {
    return next(error)
  }
}

export async function createCoupon(req, res, next) {
  try {
    const coupon = await Coupon.create(req.body)
    return sendCreated(res, { coupon })
  } catch (error) {
    return next(error)
  }
}

export async function updateCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findById(req.params.couponId)
    if (!coupon) throw notFound('Promo code not found.', 'COUPON_NOT_FOUND')

    Object.assign(coupon, req.body)
    await coupon.save()
    return sendSuccess(res, { coupon }, 200, 'Promo code updated.')
  } catch (error) {
    return next(error)
  }
}

export async function deleteCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.couponId)
    if (!coupon) throw notFound('Promo code not found.', 'COUPON_NOT_FOUND')
    return sendSuccess(res, null, 200, 'Promo code deleted.')
  } catch (error) {
    return next(error)
  }
}

export async function listReviews(req, res, next) {
  try {
    const { page, limit, status } = req.query
    const filter = {}
    if (status) filter.status = status

    const [reviews, total] = await Promise.all([
      ReviewModel.find(filter)
        .populate('product', 'catalogId name image slug')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ReviewModel.countDocuments(filter),
    ])

    return sendSuccess(res, {
      reviews: reviews.map(serializeReview),
      pagination: { page, pages: Math.ceil(total / limit), total },
    })
  } catch (error) {
    return next(error)
  }
}

export async function setReviewStatus(req, res, next) {
  try {
    const review = await ReviewModel.findById(req.params.reviewId)
    if (!review) throw notFound('Review not found.', 'REVIEW_NOT_FOUND')

    review.status = req.body.status
    await review.save()
    await recalculateProductRating(review.product)

    return sendSuccess(res, { review: serializeReview(review) }, 200, 'Review updated.')
  } catch (error) {
    return next(error)
  }
}

export async function deleteReview(req, res, next) {
  try {
    const review = await ReviewModel.findByIdAndDelete(req.params.reviewId)
    if (!review) throw notFound('Review not found.', 'REVIEW_NOT_FOUND')
    await recalculateProductRating(review.product)
    return sendSuccess(res, null, 200, 'Review deleted.')
  } catch (error) {
    return next(error)
  }
}

export async function listActivity(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30))
    const [activity, total] = await Promise.all([
      ActivityLog.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('actor', 'name email'),
      ActivityLog.countDocuments(),
    ])

    return sendSuccess(res, {
      activity,
      pagination: { page, pages: Math.ceil(total / limit), total },
    })
  } catch (error) {
    return next(error)
  }
}
