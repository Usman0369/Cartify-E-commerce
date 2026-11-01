import mongoose from 'mongoose'

const refreshSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    userAgent: {
      type: String,
      default: '',
      maxlength: 400,
    },
    ip: {
      type: String,
      default: '',
      maxlength: 100,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
    replacedByTokenHash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
)

refreshSessionSchema.index({ user: 1, revokedAt: 1 })

export const RefreshSession = mongoose.model(
  'RefreshSession',
  refreshSessionSchema,
)
