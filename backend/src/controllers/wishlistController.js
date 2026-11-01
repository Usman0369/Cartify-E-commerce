import mongoose from 'mongoose'
import { Product } from '../models/Product.js'
import { Wishlist } from '../models/Wishlist.js'
import { notFound } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/response.js'
import { serializeProduct } from '../utils/serializers.js'

async function getWishlist(userId, populate = false) {
  let wishlist = await Wishlist.findOne({ user: userId })
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] })
  if (populate) await wishlist.populate('products')
  return wishlist
}

async function findProductReference(reference) {
  const or = [{ catalogId: String(reference) }, { slug: String(reference) }]
  if (mongoose.isValidObjectId(reference)) or.push({ _id: reference })
  return Product.findOne({ $or: or, active: true })
}

export async function getMyWishlist(req, res, next) {
  try {
    const wishlist = await getWishlist(req.user._id, true)
    return sendSuccess(res, {
      items: wishlist.products.filter(Boolean).map(serializeProduct),
    })
  } catch (error) {
    return next(error)
  }
}

export async function addToWishlist(req, res, next) {
  try {
    const product = await findProductReference(req.params.productId)
    if (!product) throw notFound('Product not found.', 'PRODUCT_NOT_FOUND')

    const wishlist = await getWishlist(req.user._id)
    if (!wishlist.products.some((id) => String(id) === String(product._id))) {
      wishlist.products.push(product._id)
      await wishlist.save()
    }

    await wishlist.populate('products')
    return sendSuccess(res, {
      items: wishlist.products.filter(Boolean).map(serializeProduct),
    })
  } catch (error) {
    return next(error)
  }
}

export async function removeFromWishlist(req, res, next) {
  try {
    const product = await findProductReference(req.params.productId)
    if (!product) throw notFound('Product not found.', 'PRODUCT_NOT_FOUND')

    const wishlist = await getWishlist(req.user._id)
    wishlist.products = wishlist.products.filter(
      (id) => String(id) !== String(product._id),
    )
    await wishlist.save()
    await wishlist.populate('products')

    return sendSuccess(res, {
      items: wishlist.products.filter(Boolean).map(serializeProduct),
    })
  } catch (error) {
    return next(error)
  }
}
