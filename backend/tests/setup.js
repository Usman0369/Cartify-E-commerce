import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import { setMailer } from '../src/services/emailService.js'
import { clearMailbox, fakeMailer } from './mailbox.js'

beforeAll(async () => {
  setMailer(fakeMailer)
  await connectDatabase()
})

afterEach(async () => {
  clearMailbox()
  setMailer(fakeMailer)
  const collections = mongoose.connection.collections
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  )
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await disconnectDatabase()
})
