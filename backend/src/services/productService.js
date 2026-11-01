import mongoose from 'mongoose'
import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'
import { notFound } from '../utils/ApiError.js'

const SORT_MAP = {
  featured: { featured: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { rating: -1, reviews: -1 },
  name: { name: 1 },
}

export async function listProducts(query = {}) {
  const filter = { active: true }

  if (query.category) {
    const category = await Category.findOne({
      $or: [
        { catalogId: String(query.category) },
        { name: new RegExp(`^${escapeRegex(query.category)}$`, 'i') },
      ],
    })
    if (!category) {
      return { products: [], total: 0, page: 1, pages: 0, categories: [] }
    }
    filter.category = category._id
  }

  if (query.brand) filter.brand = query.brand
  if (query.featured === true) filter.featured = true
  if (query.bestSeller === true) filter.bestSeller = true
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {}
    if (query.minPrice !== undefined) filter.price.$gte = query.minPrice
    if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice
  }
  if (query.search) {
    const term = String(query.search).trim()
    if (term) {
      filter.$or = [
        { name: new RegExp(escapeRegex(term), 'i') },
        { brand: new RegExp(escapeRegex(term), 'i') },
        { description: new RegExp(escapeRegex(term), 'i') },
      ]
    }
  }
  if (query.availability === 'in-stock') filter.stock = { $gt: 0 }

  const page = Math.max(1, query.page ?? 1)
  const limit = Math.min(100, Math.max(1, query.limit ?? 24))
  const sort = SORT_MAP[query.sort] ?? SORT_MAP.featured

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ])

  return {
    products,
    total,
    page,
    pages: Math.ceil(total / limit),
  }
}

export async function getProduct(reference) {
  const or = [{ catalogId: String(reference) }, { slug: String(reference) }]
  if (mongoose.isValidObjectId(reference)) or.push({ _id: reference })

  const product = await Product.findOne({ $or: or }).populate('category')
  if (!product) throw notFound('Product not found.', 'PRODUCT_NOT_FOUND')
  return product
}

export async function listCategories({ includeCounts = false } = {}) {
  const categories = await Category.find({ active: true }).sort({
    name: 1,
  })

  if (!includeCounts) return categories

  const counts = await Product.aggregate([
    { $match: { active: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ])
  const countMap = new Map(counts.map((entry) => [String(entry._id), entry.count]))

  return categories.map((category) => ({
    category,
    productCount: countMap.get(String(category._id)) ?? 0,
  }))
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
