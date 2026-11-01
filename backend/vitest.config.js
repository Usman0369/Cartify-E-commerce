import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/cartify_test',
      JWT_ACCESS_SECRET: 'cartify-test-access-secret-that-is-long-enough',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_DAYS: '7',
      COOKIE_SECURE: 'false',
      RATE_LIMIT_DISABLED: 'true',
      BREVO_API_KEY: '',
      BREVO_SENDER_EMAIL: 'no-reply@cartify.test',
      ADMIN_NAME: 'Test Admin',
      ADMIN_EMAIL: 'admin@cartify.test',
      ADMIN_PASSWORD: 'TestAdminPassword123!',
    },
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    setupFiles: ['./tests/setup.js'],
    testTimeout: 20000,
    hookTimeout: 30000,
  },
})
