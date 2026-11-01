import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: {
      type: String,
      default: 'Home',
      trim: true,
      maxlength: 50,
    },
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, default: '', trim: true, maxlength: 30 },
    address1: { type: String, required: true, trim: true, maxlength: 200 },
    address2: { type: String, default: '', trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    region: { type: String, required: true, trim: true, maxlength: 100 },
    postalCode: { type: String, required: true, trim: true, maxlength: 30 },
    country: { type: String, required: true, trim: true, maxlength: 100 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
)

addressSchema.index({ user: 1, isDefault: -1, createdAt: -1 })

export const Address = mongoose.model('Address', addressSchema)
