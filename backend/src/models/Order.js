import mongoose from 'mongoose'
import { ORDER_STATUSES } from '../config/constants.js'

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productId: { type: String, required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String, default: '' },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    note: { type: String, default: '', maxlength: 500 },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    contact: {
      firstName: { type: String, required: true, trim: true, maxlength: 80 },
      lastName: { type: String, required: true, trim: true, maxlength: 80 },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        maxlength: 200,
      },
      phone: { type: String, default: '', trim: true, maxlength: 30 },
    },
    shippingAddress: {
      address1: { type: String, required: true, maxlength: 200 },
      address2: { type: String, default: '', maxlength: 200 },
      city: { type: String, required: true, maxlength: 100 },
      region: { type: String, required: true, maxlength: 100 },
      postalCode: { type: String, required: true, maxlength: 30 },
      country: { type: String, required: true, maxlength: 100 },
    },
    delivery: {
      id: { type: String, required: true },
      label: { type: String, required: true },
      description: { type: String, default: '' },
    },
    payment: {
      provider: { type: String, default: 'demo' },
      status: { type: String, default: 'not_charged' },
      brand: { type: String, default: 'Card', maxlength: 40 },
      last4: { type: String, default: '', maxlength: 4 },
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'An order must contain at least one item.',
      },
    },
    promo: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'Confirmed',
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    guestTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    stockRestored: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

orderSchema.index({ createdAt: -1 })
orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })

export const Order = mongoose.model('Order', orderSchema)
