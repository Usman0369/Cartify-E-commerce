import request from 'supertest'
import { app } from '../src/app.js'
import { Category } from '../src/models/Category.js'
import { Coupon } from '../src/models/Coupon.js'
import { Product } from '../src/models/Product.js'
import { User } from '../src/models/User.js'
import { latestCode } from './mailbox.js'

export { app, request }

export async function registerUser({
  name = 'Test Shopper',
  email = 'shopper@example.com',
  password = 'ShopperPassword123!',
} = {}) {
  return request(app).post('/api/auth/register').send({ name, email, password })
}

export async function verifyUserEmail(email, challengeId = undefined) {
  const code = latestCode(email, 'email_verify')
  return request(app)
    .post('/api/auth/verify-email')
    .send({ email, code, challengeId })
}

export async function createVerifiedUser(options = {}) {
  const user = {
    name: 'Test Shopper',
    email: 'shopper@example.com',
    password: 'ShopperPassword123!',
    ...options,
  }
  const registration = await registerUser(user)
  const challengeId = registration.body.data?.challengeId
  await verifyUserEmail(user.email, challengeId)
  return user
}

export async function loginUser(email, password = 'ShopperPassword123!') {
  return request(app).post('/api/auth/login').send({ email, password })
}

export async function loginVerifiedUser(user) {
  const response = await loginUser(user.email, user.password)
  return {
    response,
    accessToken: response.body.data?.accessToken,
    cookie: response.headers['set-cookie']?.[0]?.split(';')[0],
  }
}

export async function createAdmin({
  name = 'Admin User',
  email = 'admin@cartify.test',
  password = 'AdminPassword123!',
} = {}) {
  const passwordHash = await User.hashPassword(password)
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'admin',
    emailVerified: true,
  })
  return { user, password }
}

export async function loginAdmin(admin) {
  const response = await loginUser(admin.user.email, admin.password)
  return response.body.data.accessToken
}

export async function seedCatalogProduct(overrides = {}) {
  const category = await Category.create({
    catalogId: 'test-category',
    name: 'Test Category',
    tagline: 'Test things',
    image: '/images/test.jpg',
  })

  const product = await Product.create({
    catalogId: 'test-product',
    slug: 'test-product',
    name: 'Test Product',
    brand: 'Cartify',
    category: category._id,
    price: 100,
    compareAt: null,
    rating: 4.5,
    reviews: 10,
    image: '/images/test.jpg',
    description: 'A reliable test product for the automated suite.',
    stock: 10,
    featured: true,
    active: true,
    ...overrides,
  })

  return { category, product }
}

export async function seedWarmCoupon() {
  return Coupon.create({
    code: 'WARM20',
    type: 'percentage',
    value: 20,
    active: true,
    minSubtotal: 0,
    usedCount: 0,
  })
}

export function bearer(token) {
  return { Authorization: `Bearer ${token}` }
}
