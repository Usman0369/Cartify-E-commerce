import mongoose from 'mongoose'
import { Product } from '../models/Product.js'
import { Review } from '../models/Review.js'
import { notFound } from '../utils/ApiError.js'
import { sendCreated, sendSuccess } from '../utils/response.js'
import { serializeReview } from '../utils/serializers.js'
import {
  hasVerifiedPurchase,
  recalculateProductRating,
} from '../services/reviewService.js'

async function findProduct(reference) {
  const or = [{ catalogId: String(reference) }, { slug: String(reference) }]
  if (mongoose.isValidObjectId(reference)) or.push({ _id: reference })
  return Product.findOne({ $or: or, active: true })
}

export async function listProductReviews(req, res, next) {
  try {
    const product = await findProduct(req.params.reference)
    if (!product) throw notFound('Product not found.', 'PRODUCT_NOT_FOUND')

    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10))
    const filter = { product: product._id, status: 'approved' }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments(filter),
    ])

    return sendSuccess(res, {
      reviews: reviews.map(serializeReview),
      pagination: { page, pages: Math.ceil(total / limit), total },
    })
  } catch (error) {
    return next(error)
  }
}

export async function createReview(req, res, next) {
  try {
    const product = await findProduct(req.body.productId)
    if (!product) throw notFound('Product not found.', 'PRODUCT_NOT_FOUND')

    const verifiedPurchase = await hasVerifiedPurchase(
      req.user._id,
      product._id,
    )

    let review = await Review.findOne({
      product: product._id,
      user: req.user._id,
    })
    const isNew = !review
    if (!review) {
      review = new Review({
        product: product._id,
        user: req.user._id,
      })
    }

    review.rating = req.body.rating
    review.title = req.body.title
    review.body = req.body.body
    review.verifiedPurchase = verifiedPurchase
    review.status = 'pending'
    await review.save()

    if (!isNew) await recalculateProductRating(product._id)

    return sendCreated(
      res,
      { review: serializeReview(review) },
      'Thanks! Your review is awaiting moderation.',
    )
  } catch (error) {
    return next(error)
  }
}

export async function deleteMyReview(req, res, next) {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.reviewId,
      user: req.user._id,
    })
    if (!review) throw notFound('Review not found.', 'REVIEW_NOT_FOUND')
    await recalculateProductRating(review.product)
    return sendSuccess(res, null, 200, 'Review removed.')
  } catch (error) {
    return next(error)
  }
}

export async function listMyReviews(req, res, next) {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'catalogId name slug image')
      .sort({ createdAt: -1 })
    return sendSuccess(res, { reviews: reviews.map(serializeReview) })
  } catch (error) {
    return next(error)
  }
}
