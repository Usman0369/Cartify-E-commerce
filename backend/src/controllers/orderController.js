import {
  cancelMyOrder,
  createOrder,
  getGuestOrder,
  getMyOrder,
  listMyOrders,
} from '../services/orderService.js'
import { sendCreated, sendSuccess } from '../utils/response.js'
import { serializeOrder } from '../utils/serializers.js'

export async function createCheckoutOrder(req, res, next) {
  try {
    const { order, guestToken } = await createOrder({
      user: req.user,
      body: req.body,
    })

    return sendCreated(res, {
      order: serializeOrder(order),
      ...(guestToken ? { guestAccessToken: guestToken } : {}),
    })
  } catch (error) {
    return next(error)
  }
}

export async function getOrders(req, res, next) {
  try {
    const result = await listMyOrders(req.user._id, req.query)
    return sendSuccess(res, {
      orders: result.orders.map(serializeOrder),
      pagination: result.pagination,
    })
  } catch (error) {
    return next(error)
  }
}

export async function getOrder(req, res, next) {
  try {
    const order = await getMyOrder(req.user._id, req.params.publicId)
    return sendSuccess(res, { order: serializeOrder(order) })
  } catch (error) {
    return next(error)
  }
}

export async function cancelOrder(req, res, next) {
  try {
    const order = await cancelMyOrder(req.user._id, req.params.publicId)
    return sendSuccess(
      res,
      { order: serializeOrder(order) },
      200,
      'Order cancelled.',
    )
  } catch (error) {
    return next(error)
  }
}

export async function lookupGuestOrder(req, res, next) {
  try {
    const { email, token } = req.body
    const order = await getGuestOrder(req.params.publicId, email, token)
    return sendSuccess(res, { order: serializeOrder(order) })
  } catch (error) {
    return next(error)
  }
}
