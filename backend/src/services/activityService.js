import { ActivityLog } from '../models/ActivityLog.js'

export async function logActivity({ type, message, actor = null, metadata = {} }) {
  try {
    await ActivityLog.create({ type, message, actor, metadata })
  } catch (error) {
    console.error('Unable to write activity log:', error.message)
  }
}
