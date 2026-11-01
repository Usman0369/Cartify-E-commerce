import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../services/cartService.js'
import { sendSuccess } from '../utils/response.js'
import { serializeCart } from '../utils/serializers.js'

export async function getMyCart(req, res, next) {
  try {
    const cart = await getCart(req.user._id)
    return sendSuccess(res, { cart: serializeCart(cart) })
  } catch (error) {
    return next(error)
  }
}

export async function addItem(req, res, next) {
  try {
    const cart = await addCartItem(
      req.user._id,
      req.body.productId,
      req.body.quantity,
    )
    return sendSuccess(res, { cart: serializeCart(cart) }, 201)
  } catch (error) {
    return next(error)
  }
}

export async function updateItem(req, res, next) {
  try {
    const cart = await updateCartItem(
      req.user._id,
      req.params.productId,
      req.body.quantity,
    )
    return sendSuccess(res, { cart: serializeCart(cart) })
  } catch (error) {
    return next(error)
  }
}

export async function removeItem(req, res, next) {
  try {
    const cart = await removeCartItem(req.user._id, req.params.productId)
    return sendSuccess(res, { cart: serializeCart(cart) })
  } catch (error) {
    return next(error)
  }
}

export async function emptyCart(req, res, next) {
  try {
    await clearCart(req.user._id)
    return sendSuccess(res, { cart: { items: [] } })
  } catch (error) {
    return next(error)
  }
}
