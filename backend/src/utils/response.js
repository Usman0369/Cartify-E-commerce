export function sendSuccess(res, data = null, statusCode = 200, message) {
  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  })
}

export function sendCreated(res, data, message) {
  return sendSuccess(res, data, 201, message)
}
