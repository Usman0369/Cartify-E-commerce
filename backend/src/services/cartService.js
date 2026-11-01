import { Cart } from '../models/Cart.js'
import { Product } from '../models/Product.js'
import { badRequest } from '../utils/ApiError.js'

async function findProduct(reference) {
  const product = await Product.findOne({
    $or: [{ catalogId: String(reference) }, { slug: String(reference) }],
    active: true,
  })

  if (!product) {
    throw badRequest('That product is not available.', 'PRODUCT_UNAVAILABLE')
  }

  return product
}

async function findCartProduct(reference) {
  const value = String(reference)
  return Product.findOne({
    $or: [{ catalogId: value }, { slug: value }],
  })
}

function cartItemProductId(entry) {
  return String(entry.product?._id ?? entry.product)
}

function findCartItem(cart, productId, product) {
  const targetId = product ? String(product._id) : String(productId)
  return cart.items.find((entry) => cartItemProductId(entry) === targetId)
}

async function getOrCreateCart(userId) {
  const existing = await Cart.findOne({ user: userId })
  if (existing) return existing
  return Cart.create({ user: userId, items: [] })
}

export async function getCart(userId) {
  const cart = await getOrCreateCart(userId)
  await cart.populate('items.product')
  return cart
}

export async function addCartItem(userId, productId, quantity = 1) {
  const product = await findProduct(productId)
  const cart = await getOrCreateCart(userId)
  const item = cart.items.find(
    (entry) => String(entry.product) === String(product._id),
  )
  const nextQuantity = (item?.quantity ?? 0) + Number(quantity)

  if (!Number.isInteger(nextQuantity) || nextQuantity < 1 || nextQuantity > 25) {
    throw badRequest('Choose a quantity between 1 and 25.', 'QUANTITY_INVALID')
  }

  if (product.stock < nextQuantity) {
    throw badRequest(
      `Only ${product.stock} of ${product.name} are available.`,
      'INSUFFICIENT_STOCK',
    )
  }

  if (item) {
    item.quantity = nextQuantity
  } else {
    cart.items.push({ product: product._id, quantity: nextQuantity })
  }

  await cart.save()
  await cart.populate('items.product')
  return cart
}

export async function updateCartItem(userId, productId, quantity) {
  const cart = await getOrCreateCart(userId)
  const cartProduct = await findCartProduct(productId)
  const item = findCartItem(cart, productId, cartProduct)

  if (!item) {
    throw badRequest('That item is not in your cart.', 'CART_ITEM_MISSING')
  }

  if (quantity <= 0) {
    cart.items = cart.items.filter((entry) => entry !== item)
    await cart.save()
    await cart.populate('items.product')
    return cart
  }

  const product = await Product.findById(item.product?._id ?? item.product)
  if (!product || !product.active) {
    throw badRequest('That product is not available.', 'PRODUCT_UNAVAILABLE')
  }

  if (quantity > 25) {
    throw badRequest('Choose a quantity between 1 and 25.', 'QUANTITY_INVALID')
  }

  if (product.stock < quantity) {
    throw badRequest(
      `Only ${product.stock} of ${product.name} are available.`,
      'INSUFFICIENT_STOCK',
    )
  }

  item.quantity = quantity
  await cart.save()
  await cart.populate('items.product')
  return cart
}

export async function removeCartItem(userId, productId) {
  const cart = await getOrCreateCart(userId)
  const product = await findCartProduct(productId)
  const targetId = product ? String(product._id) : String(productId)
  cart.items = cart.items.filter(
    (entry) => cartItemProductId(entry) !== targetId,
  )
  await cart.save()
  await cart.populate('items.product')
  return cart
}

export async function clearCart(userId) {
  await Cart.updateOne({ user: userId }, { $set: { items: [] } })
}

export async function mergeGuestCart(userId, guestItems = []) {
  if (!Array.isArray(guestItems) || guestItems.length === 0) {
    return getCart(userId)
  }

  const cart = await getOrCreateCart(userId)

  for (const guestItem of guestItems.slice(0, 50)) {
    const reference = guestItem.productId ?? guestItem.product ?? guestItem.id
    if (!reference) continue

    let product
    try {
      product = await findProduct(reference)
    } catch {
      continue
    }

    const quantity = Math.min(
      Math.max(1, Number.parseInt(guestItem.quantity, 10) || 1),
      product.stock,
      25,
    )
    if (quantity < 1) continue

    const existing = cart.items.find(
      (entry) => String(entry.product) === String(product._id),
    )

    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, product.stock, 25)
    } else {
      cart.items.push({ product: product._id, quantity })
    }
  }

  await cart.save()
  await cart.populate('items.product')
  return cart
}
