import { z } from 'zod'

const name = z.string().trim().min(1, 'This field is required.').max(80)

export const addressFields = {
  address1: z.string().trim().min(3, 'Enter a street address.').max(200),
  address2: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().min(1, 'Enter a city.').max(100),
  region: z.string().trim().min(1, 'Enter a state or region.').max(100),
  postalCode: z.string().trim().min(3, 'Enter a postal code.').max(30),
  country: z.string().trim().min(1, 'Enter a country.').max(100),
}

export const createOrderSchema = z.object({
  contact: z.object({
    firstName: name,
    lastName: name,
    email: z.string().trim().toLowerCase().email('Enter a valid email.').max(200),
    phone: z.string().trim().max(30).optional().default(''),
  }),
  shippingAddress: z.object(addressFields),
  deliveryMethod: z.enum(['standard', 'express']).default('standard'),
  promo: z.string().trim().max(40).optional().default(''),
  payment: z.object({
    cardholder: z.string().trim().min(2, 'Enter the name on the card.').max(80),
    cardNumber: z.preprocess(
      (value) => String(value ?? '').replace(/\s+/g, ''),
      z.string().regex(/^\d{13,19}$/, 'Enter a valid card number.'),
    ),
    expiry: z
      .string()
      .trim()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY format.'),
    cvc: z.string().trim().regex(/^\d{3,4}$/, 'Enter a valid CVC.'),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1).max(120),
        quantity: z.coerce.number().int().min(1).max(25),
      }),
    )
    .max(50)
    .optional(),
})

export const orderStatusSchema = z.object({
  status: z.enum([
    'Confirmed',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Refunded',
  ]),
  note: z.string().trim().max(500).optional().default(''),
})

export const guestOrderLookupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  token: z.string().trim().min(20).max(200),
})

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
