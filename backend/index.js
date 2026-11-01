import mongoose from 'mongoose'
import { app } from './src/app.js'
import { env } from './src/config/env.js'
import { connectDatabase } from './src/config/database.js'

let server

async function start() {
  await connectDatabase()

  server = app.listen(env.PORT, () => {
    console.log(`Cartify API listening on http://localhost:${env.PORT}`)
    console.log(`Environment: ${env.NODE_ENV}`)
  })
}

async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down...`)
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
  await mongoose.disconnect()
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})

start().catch((error) => {
  console.error('Unable to start Cartify API:', error)
  process.exit(1)
})
