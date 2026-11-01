import {
  DELIVERY_METHODS,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_RATE,
} from '../config/constants.js'
import { Coupon } from '../models/Coupon.js'
import { Order } from '../models/Order.js'
import { badRequest } from '../utils/ApiError.js'
import { roundMoney } from '../utils/money.js'

export function resolveDelivery(deliveryId = 'standard') {
  return DELIVERY_METHODS[deliveryId] ?? null
}

async function resolveCoupon({ code, subtotal, userId }) {
  const normalized = String(code).trim().toUpperCase()
  if (!normalized) return { coupon: null, discount: 0 }

  const coupon = await Coupon.findOne({ code: normalized, active: true })
  const now = new Date()

  const invalid =
    !coupon ||
    (coupon.startsAt && coupon.startsAt > now) ||
    (coupon.expiresAt && coupon.expiresAt <= now)

  if (invalid) {
    throw badRequest('That promo code is not available.', 'PROMO_INVALID')
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw badRequest('That promo code has reached its limit.', 'PROMO_EXHAUSTED')
  }

  if (subtotal < coupon.minSubtotal) {
    throw badRequest(
      `This promo code requires a minimum subtotal of $${coupon.minSubtotal.toFixed(2)}.`,
      'PROMO_MINIMUM',
    )
  }

  if (coupon.perUserLimit !== null) {
    if (!userId) {
      throw badRequest(
        'Please sign in to use this promo code.',
        'PROMO_SIGN_IN_REQUIRED',
      )
    }

    const priorUses = await Order.countDocuments({
      user: userId,
      promo: coupon.code,
      status: { $ne: 'Cancelled' },
    })

    if (priorUses >= coupon.perUserLimit) {
      throw badRequest(
        'You have already used this promo code.',
        'PROMO_USER_LIMIT',
      )
    }
  }

  let discount =
    coupon.type === 'percentage'
      ? (subtotal * coupon.value) / 100
      : coupon.value

  if (coupon.maxDiscount !== null) {
    discount = Math.min(discount, coupon.maxDiscount)
  }

  discount = roundMoney(Math.min(Math.max(0, discount), subtotal))

  return { coupon, discount }
}

export async function quoteCart({
  items,
  promoCode,
  deliveryId = 'standard',
  userId = null,
}) {
  const delivery = resolveDelivery(deliveryId)
  if (!delivery) {
    throw badRequest('Choose a valid delivery method.', 'DELIVERY_INVALID')
  }

  if (!Array.isArray(items) || items.length === 0) {
    return {
      items: [],
      subtotal: 0,
      discount: 0,
      shipping: 0,
      total: 0,
      promo: null,
      coupon: null,
      delivery,
    }
  }

  const quotedItems = items.map((item) => {
    const product = item.product
    const quantity = Number(item.quantity)

    if (!product) {
      throw badRequest('A product in your cart is no longer available.', 'PRODUCT_UNAVAILABLE')
    }

    if (!product.active) {
      throw badRequest(
        `${product.name} is no longer available.`,
        'PRODUCT_UNAVAILABLE',
      )
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 25) {
      throw badRequest(
        `Choose a quantity between 1 and 25 for ${product.name}.`,
        'QUANTITY_INVALID',
      )
    }

    if (product.stock < quantity) {
      throw badRequest(
        `Only ${product.stock} of ${product.name} are available.`,
        'INSUFFICIENT_STOCK',
      )
    }

    return {
      product,
      quantity,
      unitPrice: product.price,
      lineTotal: roundMoney(product.price * quantity),
    }
  })

  const subtotal = roundMoney(
    quotedItems.reduce((sum, item) => sum + item.lineTotal, 0),
  )

  const { coupon, discount } = promoCode
    ? await resolveCoupon({ code: promoCode, subtotal, userId })
    : { coupon: null, discount: 0 }

  const baseShipping =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_RATE
  const shipping = roundMoney(baseShipping + delivery.surcharge)
  const total = roundMoney(Math.max(0, subtotal - discount + shipping))

  return {
    items: quotedItems,
    subtotal,
    discount,
    shipping,
    total,
    promo: coupon?.code ?? null,
    coupon,
    delivery,
  }
}
