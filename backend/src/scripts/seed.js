import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { connectDatabase } from '../config/database.js'
import { Category } from '../models/Category.js'
import { Coupon } from '../models/Coupon.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { PROMO_CODE, PROMO_DISCOUNT_RATE, ROLES } from '../config/constants.js'
import {
  categories as catalogCategories,
  products as catalogProducts,
} from '../data/seedCatalog.js'

const fresh = process.argv.includes('--fresh')

async function seedCatalog() {
  if (fresh) {
    await Product.deleteMany({})
    await Category.deleteMany({})
    console.log('Cleared existing catalog.')
  }

  const categoryMap = new Map()
  for (const category of catalogCategories) {
    const document = await Category.findOneAndUpdate(
      { catalogId: category.id },
      {
        $set: {
          name: category.name,
          tagline: category.tagline,
          image: category.image,
          active: true,
        },
        $setOnInsert: { catalogId: category.id },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
    categoryMap.set(category.name, document)
  }

  for (const product of catalogProducts) {
    const category = categoryMap.get(product.category)
    if (!category) {
      throw new Error(`Missing seed category: ${product.category}`)
    }

    const catalogFields = {
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: category._id,
      price: product.price,
      compareAt: product.compareAt,
      rating: product.rating,
      reviews: product.reviews,
      image: product.image,
      badge: product.badge,
      description: product.description,
      featured: Boolean(product.featured),
      bestSeller: Boolean(product.bestSeller),
      specs: product.specs ?? [],
      features: product.features ?? [],
      active: true,
    }

    if (fresh) catalogFields.stock = product.stock

    await Product.findOneAndUpdate(
      { catalogId: product.id },
      {
        $set: catalogFields,
        $setOnInsert: { catalogId: product.id, stock: product.stock },
      },
      { upsert: true, setDefaultsOnInsert: true },
    )
  }

  console.log(
    `Seeded ${catalogCategories.length} categories and ${catalogProducts.length} products.`,
  )
}

async function seedCoupon() {
  await Coupon.findOneAndUpdate(
    { code: PROMO_CODE },
    {
      $set: {
        description: 'Warm welcome: 20% off your order.',
        type: 'percentage',
        value: PROMO_DISCOUNT_RATE * 100,
        minSubtotal: 0,
        active: true,
      },
      $setOnInsert: { code: PROMO_CODE, usedCount: 0 },
    },
    { upsert: true, setDefaultsOnInsert: true },
  )
  console.log(`Promo code ${PROMO_CODE} is ready.`)
}

async function seedAdmin() {
  const existing = await User.findOne({ email: env.ADMIN_EMAIL })

  if (existing) {
    if (existing.role !== ROLES.ADMIN || !existing.emailVerified) {
      existing.role = ROLES.ADMIN
      existing.emailVerified = true
      await existing.save()
    }
    console.log(`Admin account already exists: ${env.ADMIN_EMAIL}`)
    return
  }

  const passwordHash = await User.hashPassword(env.ADMIN_PASSWORD)
  await User.create({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    passwordHash,
    role: ROLES.ADMIN,
    emailVerified: true,
  })
  console.log(`Created admin account: ${env.ADMIN_EMAIL}`)
}

async function main() {
  await connectDatabase()
  await seedCatalog()
  await seedCoupon()
  await seedAdmin()
  console.log('Seed complete.')
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
