import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    catalogId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 80,
    },
    tagline: {
      type: String,
      default: '',
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
)

export const Category = mongoose.model('Category', categorySchema)
