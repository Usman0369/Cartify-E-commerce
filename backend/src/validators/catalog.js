import { z } from 'zod'

const optionalNumber = z.coerce.number().min(0).optional()
const optionalText = (max) => z.string().trim().max(max).optional()
const booleanQuery = z.preprocess((value) => {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return undefined
}, z.boolean().optional())

export const productQuerySchema = z.object({
  category: z.string().trim().max(80).optional(),
  brand: z.string().trim().max(80).optional(),
  search: z.string().trim().max(120).optional(),
  sort: z
    .enum(['featured', 'newest', 'price-asc', 'price-desc', 'rating', 'name'])
    .optional(),
  featured: booleanQuery,
  bestSeller: booleanQuery,
  minPrice: optionalNumber,
  maxPrice: optionalNumber,
  availability: z.enum(['in-stock']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
})

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(160),
  brand: z.string().trim().min(1).max(80),
  categoryId: z.string().trim().min(1),
  price: z.coerce.number().min(0),
  compareAt: z.coerce.number().min(0).nullable().optional(),
  description: z.string().trim().min(10).max(2000),
  image: z.string().trim().max(500).optional().default(''),
  badge: z.string().trim().max(60).nullable().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  featured: z.boolean().optional().default(false),
  bestSeller: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  specs: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        value: z.string().trim().min(1).max(160),
      }),
    )
    .max(12)
    .optional()
    .default([]),
  features: z.array(z.string().trim().min(1).max(200)).max(12).optional().default([]),
})

export const updateProductSchema = createProductSchema.partial()

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  tagline: optionalText(160).default(''),
  description: optionalText(1000).default(''),
  image: optionalText(500).default(''),
  active: z.boolean().optional().default(true),
})

export const updateCategorySchema = createCategorySchema.partial()

export const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/, 'Use letters, numbers, hyphens, or underscores.'),
  description: optionalText(300).default(''),
  type: z.enum(['percentage', 'fixed']).default('percentage'),
  value: z.coerce.number().min(0),
  minSubtotal: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().min(0).nullable().optional(),
  startsAt: z.coerce.date().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  usageLimit: z.coerce.number().int().min(1).nullable().optional(),
  perUserLimit: z.coerce.number().int().min(1).nullable().optional(),
  active: z.boolean().optional().default(true),
})

export const updateCouponSchema = createCouponSchema.partial()

export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  status: z.string().trim().max(40).optional(),
  role: z.enum(['customer', 'admin']).optional(),
  sort: z.string().trim().max(40).optional(),
})
