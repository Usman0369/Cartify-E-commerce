import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      index: true,
      maxlength: 80,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
)

activityLogSchema.index({ createdAt: -1 })

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema)
