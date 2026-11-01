import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'
import morgan from 'morgan'
import { env } from './config/env.js'
import { requestId } from './middleware/requestId.js'
import { sanitizeRequest } from './middleware/sanitize.js'
import { globalLimiter } from './middleware/rateLimits.js'
import { errorHandler, notFoundHandler } from './middleware/errors.js'
import { ApiError } from './utils/ApiError.js'
import { authRouter } from './routes/authRoutes.js'
import { cartRouter } from './routes/cartRoutes.js'
import { catalogRouter } from './routes/catalogRoutes.js'
import { orderRouter } from './routes/orderRoutes.js'
import { addressRouter } from './routes/addressRoutes.js'
import { wishlistRouter } from './routes/wishlistRoutes.js'
import { reviewRouter } from './routes/reviewRoutes.js'
import { adminRouter } from './routes/adminRoutes.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(requestId)
  app.use(helmet())
  app.use(compression())
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.clientOrigins.includes(origin)) {
          return callback(null, true)
        }
        return callback(
          new ApiError(403, 'Origin is not allowed by CORS.', {
            code: 'CORS_DENIED',
          }),
        )
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  )
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())
  app.use(sanitizeRequest)

  if (!env.isTest) {
    app.use(morgan(env.isProduction ? 'combined' : 'dev'))
  }

  app.get('/api/health', (_req, res) => {
    const dbReady = mongoose.connection.readyState === 1
    res.status(dbReady ? 200 : 503).json({
      success: dbReady,
      status: dbReady ? 'ok' : 'degraded',
      database: dbReady ? 'connected' : 'disconnected',
      uptime: process.uptime(),
    })
  })

  app.use('/api', globalLimiter)
  app.use('/api/auth', authRouter)
  app.use('/api/cart', cartRouter)
  app.use('/api/orders', orderRouter)
  app.use('/api/addresses', addressRouter)
  app.use('/api/wishlist', wishlistRouter)
  app.use('/api/reviews', reviewRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api', catalogRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

export const app = createApp()
