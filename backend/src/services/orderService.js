import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { Coupon } from '../models/Coupon.js'
import { getCart, clearCart } from './cartService.js'
import { quoteCart } from './pricingService.js'
import { logActivity } from './activityService.js'
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from '../utils/ApiError.js'
import { generatePublicId, generateToken, hashToken, safeEqual } from '../utils/crypto.js'
import { roundMoney } from '../utils/money.js'

async function findCheckoutProduct(reference) {
  const value = String(reference)
  const product = await Product.findOne({
    $or: [{ catalogId: value }, { slug: value }],
    active: true,
  })
  if (!product) {
    throw badRequest('A product in your cart is no longer available.', 'PRODUCT_UNAVAILABLE')
  }
  return product
}

async function resolveItems(userId, submittedItems) {
  if (Array.isArray(submittedItems) && submittedItems.length > 0) {
    const grouped = new Map()

    for (const item of submittedItems) {
      const reference = item.productId ?? item.product ?? item.id
      const product = await findCheckoutProduct(reference)
      const key = String(product._id)
      grouped.set(key, {
        product,
        quantity: (grouped.get(key)?.quantity ?? 0) + Number(item.quantity),
      })
    }

    return [...grouped.values()]
  }

  if (!userId) {
    throw badRequest('Add at least one item to your order.', 'ORDER_EMPTY')
  }

  const cart = await getCart(userId)
  return cart.items
    .filter((item) => item.product)
    .map((item) => ({ product: item.product, quantity: item.quantity }))
}

function cardBrand(cardNumber) {
  if (/^4/.test(cardNumber)) return 'Visa'
  if (/^5[1-5]/.test(cardNumber)) return 'Mastercard'
  if (/^3[47]/.test(cardNumber)) return 'American Express'
  if (/^6(?:011|5)/.test(cardNumber)) return 'Discover'
  return 'Card'
}

async function decrementStock(items) {
  const decremented = []

  for (const item of items) {
    const updated = await Product.findOneAndUpdate(
      {
        _id: item.product._id,
        active: true,
        stock: { $gte: item.quantity },
      },
      { $inc: { stock: -item.quantity } },
      { new: true },
    )

    if (!updated) {
      await restoreStockForItems(decremented)
      throw badRequest(
        `${item.product.name} just sold out. Update your cart and try again.`,
        'INSUFFICIENT_STOCK',
      )
    }

    decremented.push(item)
  }

  return decremented
}

async function restoreStockForItems(items) {
  await Promise.all(
    items.map((item) =>
      Product.updateOne(
        { _id: item.product._id },
        { $inc: { stock: item.quantity } },
      ),
    ),
  )
}

async function incrementCoupon(coupon) {
  if (!coupon) return
  const query = { _id: coupon._id }
  if (coupon.usageLimit !== null && coupon.usageLimit !== undefined) {
    query.$expr = { $lt: ['$usedCount', '$usageLimit'] }
  }
  const result = await Coupon.updateOne(query, { $inc: { usedCount: 1 } })
  if (result.matchedCount === 0) {
    throw badRequest('That promo code is no longer available.', 'PROMO_EXHAUSTED')
  }
}

async function decrementCoupon(code) {
  if (!code) return
  await Coupon.updateOne(
    { code, usedCount: { $gt: 0 } },
    { $inc: { usedCount: -1 } },
  )
}

async function restoreOrderStock(order) {
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, stockRestored: false },
    { $set: { stockRestored: true } },
    { new: true },
  )

  if (!claimed) return false

  await Promise.all(
    claimed.items.map((item) =>
      Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } },
      ),
    ),
  )
  await decrementCoupon(claimed.promo)
  return true
}

export async function createOrder({
  user = null,
  body,
  guestCartItems,
}) {
  const submittedItems = body.items ?? guestCartItems
  const items = await resolveItems(user?._id ?? null, submittedItems)

  if (items.length === 0) {
    throw badRequest('Add at least one item to your order.', 'ORDER_EMPTY')
  }

  const quote = await quoteCart({
    items,
    promoCode: body.promo,
    deliveryId: body.deliveryMethod,
    userId: user?._id ?? null,
  })

  const cardNumber = body.payment.cardNumber.replace(/\s+/g, '')
  const guestToken = user ? null : generateToken(32)
  let decremented = []
  let couponIncremented = false
  let order

  try {
    decremented = await decrementStock(quote.items)
    await incrementCoupon(quote.coupon)
    couponIncremented = Boolean(quote.coupon)

    order = await Order.create({
      publicId: generatePublicId('order'),
      user: user?._id ?? null,
      contact: {
        firstName: body.contact.firstName,
        lastName: body.contact.lastName,
        email: body.contact.email,
        phone: body.contact.phone,
      },
      shippingAddress: body.shippingAddress,
      delivery: {
        id: quote.delivery.id,
        label: quote.delivery.label,
        description: quote.delivery.description,
      },
      payment: {
        provider: 'demo',
        status: 'not_charged',
        brand: cardBrand(cardNumber),
        last4: cardNumber.slice(-4),
      },
      items: quote.items.map((item) => ({
        product: item.product._id,
        productId: item.product.catalogId,
        slug: item.product.slug,
        name: item.product.name,
        brand: item.product.brand,
        image: item.product.image,
        price: item.unitPrice,
        quantity: item.quantity,
        lineTotal: roundMoney(item.unitPrice * item.quantity),
      })),
      promo: quote.promo,
      subtotal: quote.subtotal,
      discount: quote.discount,
      shipping: quote.shipping,
      total: quote.total,
      currency: 'USD',
      status: 'Confirmed',
      statusHistory: [
        {
          status: 'Confirmed',
          changedBy: null,
          note: 'Order placed.',
          changedAt: new Date(),
        },
      ],
      guestTokenHash: guestToken ? hashToken(guestToken) : null,
    })
  } catch (error) {
    if (decremented.length > 0) {
      await restoreStockForItems(decremented)
    }
    if (couponIncremented) {
      await decrementCoupon(quote.promo)
    }
    throw error
  }

  if (user) {
    try {
      await clearCart(user._id)
    } catch (error) {
      console.error('Unable to clear cart after order:', error.message)
    }
  }

  await logActivity({
    type: 'order.created',
    message: `Order ${order.publicId} placed for $${order.total.toFixed(2)}.`,
    actor: user?._id ?? null,
    metadata: { orderId: String(order._id), total: order.total },
  })

  return { order, guestToken }
}

export async function listMyOrders(userId, { page = 1, limit = 20 } = {}) {
  const [orders, total] = await Promise.all([
    Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments({ user: userId }),
  ])

  return {
    orders,
    pagination: { page, pages: Math.ceil(total / limit), total },
  }
}

export async function getMyOrder(userId, publicId) {
  const order = await Order.findOne({ publicId, user: userId })
  if (!order) throw notFound('Order not found.', 'ORDER_NOT_FOUND')
  return order
}

export async function getGuestOrder(publicId, email, token) {
  const order = await Order.findOne({ publicId }).select('+guestTokenHash')
  if (!order || !order.user) {
    if (!order || !order.guestTokenHash) {
      throw notFound('Order not found.', 'ORDER_NOT_FOUND')
    }
    if (
      order.contact.email.toLowerCase() !== String(email).trim().toLowerCase() ||
      !safeEqual(hashToken(token), order.guestTokenHash)
    ) {
      throw forbidden('Those order details could not be verified.', 'ORDER_ACCESS_DENIED')
    }
    order.guestTokenHash = undefined
    return order
  }

  throw notFound('Order not found.', 'ORDER_NOT_FOUND')
}

export async function cancelMyOrder(userId, publicId) {
  const order = await Order.findOne({ publicId, user: userId })
  if (!order) throw notFound('Order not found.', 'ORDER_NOT_FOUND')

  if (!['Confirmed', 'Processing'].includes(order.status)) {
    throw conflict(
      'This order can no longer be cancelled online. Contact support for help.',
      'ORDER_NOT_CANCELLABLE',
    )
  }

  const updated = await Order.findOneAndUpdate(
    {
      _id: order._id,
      status: { $in: ['Confirmed', 'Processing'] },
    },
    {
      $set: { status: 'Cancelled' },
      $push: {
        statusHistory: {
          status: 'Cancelled',
          changedBy: userId,
          note: 'Cancelled by customer.',
          changedAt: new Date(),
        },
      },
    },
    { new: true },
  )

  if (!updated) {
    throw conflict('This order changed while you were cancelling it.', 'ORDER_CHANGED')
  }

  await restoreOrderStock(updated)
  await logActivity({
    type: 'order.cancelled',
    message: `Order ${updated.publicId} cancelled by customer.`,
    actor: userId,
    metadata: { orderId: String(updated._id) },
  })

  return updated
}

export async function updateOrderStatus(publicId, status, adminId, note = '') {
  const order = await Order.findOne({ publicId })
  if (!order) throw notFound('Order not found.', 'ORDER_NOT_FOUND')

  if (order.status === status) return order

  if (['Cancelled', 'Refunded'].includes(order.status)) {
    throw conflict(
      'Cancelled or refunded orders cannot be moved to another status.',
      'ORDER_STATUS_LOCKED',
    )
  }

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    {
      $set: { status },
      $push: {
        statusHistory: {
          status,
          changedBy: adminId,
          note,
          changedAt: new Date(),
        },
      },
    },
    { new: true },
  )

  if (!updated) {
    throw conflict('The order changed while you were updating it.', 'ORDER_CHANGED')
  }

  if (['Cancelled', 'Refunded'].includes(status)) {
    await restoreOrderStock(updated)
  }

  await logActivity({
    type: 'order.status_updated',
    message: `Order ${updated.publicId} marked ${status}.`,
    actor: adminId,
    metadata: { orderId: String(updated._id), status },
  })

  return updated
}
