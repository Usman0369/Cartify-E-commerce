import mongoose from 'mongoose'

const specSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 80 },
    value: { type: String, required: true, trim: true, maxlength: 160 },
  },
  { _id: false },
)

const productSchema = new mongoose.Schema(
  {
    catalogId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAt: {
      type: Number,
      default: null,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    badge: {
      type: String,
      default: null,
      trim: true,
      maxlength: 60,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    bestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    specs: {
      type: [specSchema],
      default: [],
    },
    features: {
      type: [{ type: String, trim: true, maxlength: 200 }],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
)

productSchema.index({ name: 'text', brand: 'text', description: 'text' })
productSchema.index({ price: 1, rating: -1, createdAt: -1 })

export const Product = mongoose.model('Product', productSchema)
