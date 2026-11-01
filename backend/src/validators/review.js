import { z } from 'zod'

export const createReviewSchema = z.object({
  productId: z.string().trim().min(1).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().default(''),
  body: z.string().trim().min(10, 'Share a little more detail.').max(2000),
})

export const reviewStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
})
