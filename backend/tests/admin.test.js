import { describe, expect, it } from 'vitest'
import { Product } from '../src/models/Product.js'
import { Review } from '../src/models/Review.js'
import {
  app,
  bearer,
  createAdmin,
  createVerifiedUser,
  loginAdmin,
  loginVerifiedUser,
  request,
  seedCatalogProduct,
  seedWarmCoupon,
} from './helpers.js'

function checkoutBody() {
  return {
    contact: {
      firstName: 'Ada',
      lastName: 'Shopper',
      email: 'ada@example.com',
      phone: '',
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
      cardNumber: '4242424242424242',
      expiry: '12/30',
      cvc: '123',
    },
  }
}

async function placeCustomerOrder() {
  const user = await createVerifiedUser({ email: 'ada@example.com' })
  const session = await loginVerifiedUser(user)
  await request(app)
    .post('/api/cart')
    .set(bearer(session.accessToken))
    .send({ productId: 'test-product', quantity: 1 })
  const order = await request(app)
    .post('/api/orders')
    .set(bearer(session.accessToken))
    .send(checkoutBody())
  return { user, session, order: order.body.data.order }
}

describe('admin dashboard and management', () => {
  it('denies customer access to admin routes', async () => {
    const user = await createVerifiedUser()
    const session = await loginVerifiedUser(user)

    const response = await request(app)
      .get('/api/admin/dashboard')
      .set(bearer(session.accessToken))

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('FORBIDDEN')
  })

  it('returns dashboard metrics and recent orders', async () => {
    const { product } = await seedCatalogProduct()
    await seedWarmCoupon()
    const { order } = await placeCustomerOrder()
    const admin = await createAdmin()
    const token = await loginAdmin(admin)

    const response = await request(app)
      .get('/api/admin/dashboard')
      .set(bearer(token))

    expect(response.status).toBe(200)
    expect(response.body.data.stats.totalProducts).toBe(1)
    expect(response.body.data.stats.totalCustomers).toBe(1)
    expect(response.body.data.stats.totalOrders).toBe(1)
    expect(response.body.data.stats.revenue).toBe(80)
    expect(response.body.data.recentOrders[0].id).toBe(order.id)
    expect(response.body.data.lowStock.length).toBe(0)
    expect(product.stock).toBe(10)
  })

  it('creates, updates, archives products and manages promo codes', async () => {
    const { category } = await seedCatalogProduct()
    const admin = await createAdmin()
    const token = await loginAdmin(admin)

    const created = await request(app)
      .post('/api/admin/products')
      .set(bearer(token))
      .send({
        name: 'Admin Created Lamp',
        brand: 'Haven',
        categoryId: category.catalogId,
        price: 75,
        compareAt: 95,
        description: 'A warm table lamp created through the admin dashboard.',
        stock: 4,
        image: '/images/lamp.jpg',
        featured: true,
      })

    expect(created.status).toBe(201)
    expect(created.body.data.product.slug).toBe('admin-created-lamp')
    expect(created.body.data.product.stock).toBe(4)

    const productId = created.body.data.product._id
    const updated = await request(app)
      .patch(`/api/admin/products/${productId}`)
      .set(bearer(token))
      .send({ price: 69, stock: 3 })
    expect(updated.status).toBe(200)
    expect(updated.body.data.product.price).toBe(69)

    const lowStock = await request(app)
      .get('/api/admin/products?status=low-stock')
      .set(bearer(token))
    expect(lowStock.body.data.products.some((item) => item._id === productId)).toBe(
      true,
    )

    const archived = await request(app)
      .delete(`/api/admin/products/${productId}`)
      .set(bearer(token))
    expect(archived.status).toBe(200)
    expect((await Product.findById(productId)).active).toBe(false)

    const coupon = await request(app)
      .post('/api/admin/coupons')
      .set(bearer(token))
      .send({
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        active: true,
      })
    expect(coupon.status).toBe(201)
    expect(coupon.body.data.coupon.code).toBe('SAVE10')
  })

  it('updates order status and restores stock on cancellation', async () => {
    const { product } = await seedCatalogProduct()
    await seedWarmCoupon()
    const { order } = await placeCustomerOrder()
    const admin = await createAdmin({ email: 'orders-admin@cartify.test' })
    const token = await loginAdmin(admin)

    const processing = await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .set(bearer(token))
      .send({ status: 'Processing', note: 'Packing it now.' })
    expect(processing.status).toBe(200)
    expect(processing.body.data.order.status).toBe('Processing')

    const cancelled = await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .set(bearer(token))
      .send({ status: 'Cancelled', note: 'Customer requested cancellation.' })
    expect(cancelled.status).toBe(200)
    expect(cancelled.body.data.order.status).toBe('Cancelled')
    expect((await Product.findById(product._id)).stock).toBe(10)

    const locked = await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .set(bearer(token))
      .send({ status: 'Shipped' })
    expect(locked.status).toBe(409)
  })

  it('moderates reviews and recalculates product ratings', async () => {
    const { product } = await seedCatalogProduct()
    const user = await createVerifiedUser({ email: 'reviewer@example.com' })
    const session = await loginVerifiedUser(user)
    const admin = await createAdmin({ email: 'review-admin@cartify.test' })
    const token = await loginAdmin(admin)

    const created = await request(app)
      .post('/api/reviews')
      .set(bearer(session.accessToken))
      .send({
        productId: product.catalogId,
        rating: 5,
        title: 'Excellent',
        body: 'This has held up really well over several weeks of use.',
      })
    expect(created.status).toBe(201)
    expect(created.body.data.review.status).toBe('pending')

    const pending = await request(app)
      .get('/api/admin/reviews?status=pending')
      .set(bearer(token))
    expect(pending.body.data.reviews).toHaveLength(1)

    const reviewId = pending.body.data.reviews[0].id
    const approved = await request(app)
      .patch(`/api/admin/reviews/${reviewId}/status`)
      .set(bearer(token))
      .send({ status: 'approved' })
    expect(approved.status).toBe(200)

    const stored = await Review.findById(reviewId)
    expect(stored.status).toBe('approved')
    expect((await Product.findById(product._id)).rating).toBe(5)
  })
})
