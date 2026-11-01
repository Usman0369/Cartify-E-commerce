import { describe, expect, it } from 'vitest'
import { Order } from '../src/models/Order.js'
import { Product } from '../src/models/Product.js'
import {
  app,
  bearer,
  createVerifiedUser,
  loginVerifiedUser,
  request,
  seedCatalogProduct,
  seedWarmCoupon,
} from './helpers.js'

function checkoutBody(overrides = {}) {
  return {
    contact: {
      firstName: 'Ada',
      lastName: 'Shopper',
      email: 'ada@example.com',
      phone: '555-0100',
    },
    shippingAddress: {
      address1: '12 Market Street',
      address2: '',
      city: 'Portland',
      region: 'Oregon',
      postalCode: '97201',
      country: 'United States',
    },
    deliveryMethod: 'standard',
    promo: 'WARM20',
    payment: {
      cardholder: 'Ada Shopper',
      cardNumber: '4242 4242 4242 4242',
      expiry: '12/30',
      cvc: '123',
    },
    ...overrides,
  }
}

describe('cart and orders', () => {
  it('adds to the server cart and creates an authoritative priced order', async () => {
    const { product } = await seedCatalogProduct()
    await seedWarmCoupon()
    const user = await createVerifiedUser()
    const session = await loginVerifiedUser(user)

    const add = await request(app)
      .post('/api/cart')
      .set(bearer(session.accessToken))
      .send({ productId: product.catalogId, quantity: 1 })
    expect(add.status).toBe(201)
    expect(add.body.data.cart.items[0].product.id).toBe('test-product')

    const orderResponse = await request(app)
      .post('/api/orders')
      .set(bearer(session.accessToken))
      .send(checkoutBody())

    expect(orderResponse.status).toBe(201)
    const order = orderResponse.body.data.order
    expect(order.id).toMatch(/^order_/)
    expect(order.status).toBe('Confirmed')
    expect(order.subtotal).toBe(100)
    expect(order.discount).toBe(20)
    expect(order.shipping).toBe(0)
    expect(order.total).toBe(80)
    expect(order.payment).toMatchObject({
      provider: 'demo',
      brand: 'Visa',
      last4: '4242',
    })
    expect(order.payment.cardNumber).toBeUndefined()
    expect(order.payment.cvc).toBeUndefined()

    const stored = await Order.findOne({ publicId: order.id }).lean()
    expect(JSON.stringify(stored)).not.toContain('4242 4242 4242 4242')
    expect(stored.payment.last4).toBe('4242')

    const updatedProduct = await Product.findById(product._id)
    expect(updatedProduct.stock).toBe(9)

    const cart = await request(app)
      .get('/api/cart')
      .set(bearer(session.accessToken))
    expect(cart.body.data.cart.items).toHaveLength(0)

    const mine = await request(app)
      .get('/api/orders')
      .set(bearer(session.accessToken))
    expect(mine.status).toBe(200)
    expect(mine.body.data.orders).toHaveLength(1)
    expect(mine.body.data.orders[0].id).toBe(order.id)
  })

  it('updates and removes server cart items by catalog id', async () => {
    const { product } = await seedCatalogProduct()
    const user = await createVerifiedUser({ email: 'cart-edit@example.com' })
    const session = await loginVerifiedUser(user)

    await request(app)
      .post('/api/cart')
      .set(bearer(session.accessToken))
      .send({ productId: product.catalogId, quantity: 1 })

    const updated = await request(app)
      .patch(`/api/cart/${product.catalogId}`)
      .set(bearer(session.accessToken))
      .send({ quantity: 3 })
    expect(updated.status).toBe(200)
    expect(updated.body.data.cart.items).toHaveLength(1)
    expect(updated.body.data.cart.items[0].quantity).toBe(3)

    const removed = await request(app)
      .delete(`/api/cart/${product.catalogId}`)
      .set(bearer(session.accessToken))
    expect(removed.status).toBe(200)
    expect(removed.body.data.cart.items).toHaveLength(0)

    const stored = await request(app)
      .get('/api/cart')
      .set(bearer(session.accessToken))
    expect(stored.body.data.cart.items).toHaveLength(0)
  })

  it('adds express delivery and rejects impossible totals from the client', async () => {
    await seedCatalogProduct({ price: 60 })
    const user = await createVerifiedUser({ email: 'express@example.com' })
    const session = await loginVerifiedUser(user)

    await request(app)
      .post('/api/cart')
      .set(bearer(session.accessToken))
      .send({ productId: 'test-product', quantity: 1 })

    const response = await request(app)
      .post('/api/orders')
      .set(bearer(session.accessToken))
      .send(
        checkoutBody({
          deliveryMethod: 'express',
          promo: '',
          subtotal: 1,
          total: 1,
        }),
      )

    expect(response.status).toBe(201)
    expect(response.body.data.order.subtotal).toBe(60)
    expect(response.body.data.order.shipping).toBe(19.9)
    expect(response.body.data.order.total).toBe(79.9)
  })

  it('restores stock when a customer cancels an unfulfilled order', async () => {
    const { product } = await seedCatalogProduct()
    const user = await createVerifiedUser({ email: 'cancel@example.com' })
    const session = await loginVerifiedUser(user)

    await request(app)
      .post('/api/cart')
      .set(bearer(session.accessToken))
      .send({ productId: product.catalogId, quantity: 2 })

    const placed = await request(app)
      .post('/api/orders')
      .set(bearer(session.accessToken))
      .send(checkoutBody({ promo: '' }))
    expect(placed.status).toBe(201)
    expect((await Product.findById(product._id)).stock).toBe(8)

    const cancelled = await request(app)
      .post(`/api/orders/${placed.body.data.order.id}/cancel`)
      .set(bearer(session.accessToken))
    expect(cancelled.status).toBe(200)
    expect(cancelled.body.data.order.status).toBe('Cancelled')
    expect((await Product.findById(product._id)).stock).toBe(10)
  })

  it('creates guest orders with a one-time access token and verified lookup', async () => {
    await seedCatalogProduct()
    await seedWarmCoupon()

    const response = await request(app)
      .post('/api/orders')
      .send({
        ...checkoutBody({ email: 'guest@example.com' }),
        contact: {
          firstName: 'Guest',
          lastName: 'Shopper',
          email: 'guest@example.com',
          phone: '',
        },
        items: [{ productId: 'test-product', quantity: 1 }],
      })

    expect(response.status).toBe(201)
    const { order, guestAccessToken } = response.body.data
    expect(order.id).toMatch(/^order_/)
    expect(guestAccessToken).toHaveLength(64)

    const lookup = await request(app)
      .post(`/api/orders/guest/${order.id}`)
      .send({ email: 'guest@example.com', token: guestAccessToken })
    expect(lookup.status).toBe(200)
    expect(lookup.body.data.order.id).toBe(order.id)

    const denied = await request(app)
      .post(`/api/orders/guest/${order.id}`)
      .send({ email: 'guest@example.com', token: 'z'.repeat(64) })
    expect(denied.status).toBe(403)
  })

  it('prevents ordering more than available stock', async () => {
    const { product } = await seedCatalogProduct({ stock: 1 })
    const user = await createVerifiedUser({ email: 'stock@example.com' })
    const session = await loginVerifiedUser(user)

    const add = await request(app)
      .post('/api/cart')
      .set(bearer(session.accessToken))
      .send({ productId: product.catalogId, quantity: 5 })
    expect(add.status).toBe(400)
    expect(add.body.code).toBe('INSUFFICIENT_STOCK')
  })
})
