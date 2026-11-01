import { describe, expect, it } from 'vitest'
import {
  app,
  bearer,
  createVerifiedUser,
  loginUser,
  loginVerifiedUser,
  registerUser,
  request,
  verifyUserEmail,
} from './helpers.js'
import { latestCode } from './mailbox.js'

describe('authentication', () => {
  it('reports API and database health', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      success: true,
      status: 'ok',
      database: 'connected',
    })
  })

  it('registers only after a real email OTP is verified', async () => {
    const user = {
      name: 'Ada Shopper',
      email: 'ada@example.com',
      password: 'ShopperPassword123!',
    }

    const registration = await registerUser(user)
    expect(registration.status).toBe(201)
    expect(registration.body.data.email).toBe(user.email)
    expect(registration.body.data.challengeId).toBeTruthy()
    expect(registration.body.data.accessToken).toBeUndefined()

    const blockedLogin = await loginUser(user.email, user.password)
    expect(blockedLogin.status).toBe(403)
    expect(blockedLogin.body.code).toBe('EMAIL_NOT_VERIFIED')

    const wrongCode = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: user.email, code: '000000' })
    expect(wrongCode.status).toBe(400)
    expect(wrongCode.body.code).toBe('OTP_INCORRECT')

    const verification = await verifyUserEmail(
      user.email,
      registration.body.data.challengeId,
    )
    expect(verification.status).toBe(200)
    expect(verification.body.data.verified).toBe(true)

    const login = await loginUser(user.email, user.password)
    expect(login.status).toBe(200)
    expect(login.body.data.user.email).toBe(user.email)
    expect(login.body.data.user.emailVerified).toBe(true)
    expect(login.body.data.accessToken).toBeTruthy()
    expect(login.headers['set-cookie'][0]).toContain('cartify_refresh=')
    expect(login.headers['set-cookie'][0]).toContain('HttpOnly')
  })

  it('does not allow duplicate accounts or expose OTPs in responses', async () => {
    const user = {
      name: 'Ada Shopper',
      email: 'ada@example.com',
      password: 'ShopperPassword123!',
    }
    const registration = await registerUser(user)
    const otp = latestCode(user.email, 'email_verify')

    expect(otp).toMatch(/^\d{6}$/)
    expect(JSON.stringify(registration.body)).not.toContain(otp)

    const duplicate = await registerUser(user)
    expect(duplicate.status).toBe(409)
    expect(duplicate.body.code).toBe('EMAIL_IN_USE')
  })

  it('refreshes with a rotating httpOnly cookie and logs out', async () => {
    const user = await createVerifiedUser()
    const login = await loginVerifiedUser(user)
    expect(login.response.status).toBe(200)

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', login.cookie)

    expect(refreshed.status).toBe(200)
    expect(refreshed.body.data.accessToken).toBeTruthy()
    expect(refreshed.headers['set-cookie'][0]).not.toBe(login.cookie)

    const me = await request(app)
      .get('/api/auth/me')
      .set(bearer(refreshed.body.data.accessToken))
    expect(me.status).toBe(200)
    expect(me.body.data.user.email).toBe(user.email)

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', refreshed.headers['set-cookie'][0].split(';')[0])
    expect(logout.status).toBe(200)

    const replay = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', refreshed.headers['set-cookie'][0].split(';')[0])
    expect(replay.status).toBe(401)
  })

  it('supports email two-factor authentication', async () => {
    const user = await createVerifiedUser({ email: 'twofactor@example.com' })
    const session = await loginVerifiedUser(user)

    const requestEnable = await request(app)
      .post('/api/auth/2fa/enable/request')
      .set(bearer(session.accessToken))
      .send({ password: user.password })
    expect(requestEnable.status).toBe(200)

    const enableCode = latestCode(user.email, '2fa_enable')
    const confirmEnable = await request(app)
      .post('/api/auth/2fa/enable/confirm')
      .set(bearer(session.accessToken))
      .send({
        code: enableCode,
        challengeId: requestEnable.body.data.challengeId,
      })
    expect(confirmEnable.status).toBe(200)
    expect(confirmEnable.body.data.user.twoFactorEnabled).toBe(true)

    const passwordStep = await loginUser(user.email, user.password)
    expect(passwordStep.status).toBe(202)
    expect(passwordStep.body.twoFactorRequired).toBe(true)
    expect(passwordStep.body.data.challengeId).toBeTruthy()

    const loginCode = latestCode(user.email, 'login_2fa')
    const finalLogin = await request(app)
      .post('/api/auth/login/2fa')
      .send({
        email: user.email,
        code: loginCode,
        challengeId: passwordStep.body.data.challengeId,
      })
    expect(finalLogin.status).toBe(200)
    expect(finalLogin.body.data.accessToken).toBeTruthy()
  })

  it('resets a password only with a valid emailed code', async () => {
    const user = await createVerifiedUser({ email: 'reset@example.com' })

    const forgot = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: user.email })
    expect(forgot.status).toBe(200)

    const code = latestCode(user.email, 'password_reset')
    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: user.email,
        code,
        password: 'BrandNewPassword456!',
        challengeId: forgot.body.data.challengeId,
      })
    expect(reset.status).toBe(200)

    const oldLogin = await loginUser(user.email, user.password)
    expect(oldLogin.status).toBe(401)

    const newLogin = await loginUser(user.email, 'BrandNewPassword456!')
    expect(newLogin.status).toBe(200)
  })

  it('rejects weak passwords with validation details', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Weak Password',
      email: 'weak@example.com',
      password: 'short',
    })

    expect(response.status).toBe(400)
    expect(response.body.code).toBe('VALIDATION_ERROR')
    expect(response.body.errors.length).toBeGreaterThan(0)
  })
})
