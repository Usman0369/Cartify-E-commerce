import { z } from 'zod'

export const addressSchema = z.object({
  label: z.string().trim().max(50).optional().default('Home'),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30).optional().default(''),
  address1: z.string().trim().min(3).max(200),
  address2: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(3).max(30),
  country: z.string().trim().min(1).max(100),
  isDefault: z.boolean().optional().default(false),
})

export const updateAddressSchema = addressSchema.partial()
