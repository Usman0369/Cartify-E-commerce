import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { Review } from '../models/Review.js'

export async function recalculateProductRating(productId) {
  const [stats] = await Review.aggregate([
    { $match: { product: productId, status: 'approved' } },
    {
      $group: {
        _id: '$product',
        rating: { $avg: '$rating' },
        reviews: { $sum: 1 },
      },
    },
  ])

  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        rating: stats ? Math.round(stats.rating * 10) / 10 : 0,
        reviews: stats?.reviews ?? 0,
      },
    },
  )
}

export async function hasVerifiedPurchase(userId, productId) {
  const order = await Order.exists({
    user: userId,
    'items.product': productId,
    status: { $nin: ['Cancelled', 'Refunded'] },
  })
  return Boolean(order)
}
