import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmailMailer } from '../src/services/emailService.js'

const otpMessage = {
  to: 'customer@example.com',
  name: 'Ada',
  code: '123456',
  purpose: 'email_verify',
  expiresMinutes: 5,
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('email delivery', () => {
  it('sends OTP email through the SMTP transport when configured', async () => {
    const sendMail = vi.fn().mockResolvedValue({
      messageId: '<smtp-message@cartify>',
      response: '250 queued',
    })
    const mailer = createEmailMailer({
      transport: { sendMail },
      senderEmail: 'sender@example.com',
      senderName: 'Cartify',
    })

    const result = await mailer.sendOtpEmail(otpMessage)

    expect(sendMail).toHaveBeenCalledOnce()
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { name: 'Cartify', address: 'sender@example.com' },
        to: 'customer@example.com',
        subject: 'Verify your Cartify email',
        text: expect.stringContaining('123456'),
        html: expect.stringContaining('123456'),
      }),
    )
    expect(result).toEqual({
      messageId: '<smtp-message@cartify>',
      response: '250 queued',
    })
  })

  it('falls back to the Brevo API when SMTP credentials are absent', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: '<api-message@cartify>' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const mailer = createEmailMailer({
      smtpUser: '',
      smtpPass: '',
      apiKey: 'test-api-key',
      senderEmail: 'sender@example.com',
      senderName: 'Cartify',
    })

    const result = await mailer.sendOtpEmail(otpMessage)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'api-key': 'test-api-key' }),
      }),
    )
    expect(result).toEqual({ messageId: '<api-message@cartify>' })
  })

  it('rejects delivery when neither SMTP nor API credentials exist', async () => {
    const mailer = createEmailMailer({
      smtpUser: '',
      smtpPass: '',
      apiKey: '',
    })

    await expect(mailer.sendOtpEmail(otpMessage)).rejects.toMatchObject({
      statusCode: 503,
      code: 'EMAIL_NOT_CONFIGURED',
    })
  })

  it('wraps SMTP transport failures in a delivery error', async () => {
    const sendMail = vi.fn().mockRejectedValue(new Error('relay rejected'))
    const mailer = createEmailMailer({ transport: { sendMail } })

    await expect(mailer.sendOtpEmail(otpMessage)).rejects.toMatchObject({
      statusCode: 502,
      code: 'EMAIL_DELIVERY_FAILED',
    })
  })
})
