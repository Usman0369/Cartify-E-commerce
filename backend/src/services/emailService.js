import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

const purposeCopy = {
  email_verify: {
    subject: 'Verify your Cartify email',
    heading: 'Verify your email',
    intro: 'Use this one-time code to finish creating your Cartify account.',
  },
  login_2fa: {
    subject: 'Your Cartify sign-in code',
    heading: 'Sign-in verification',
    intro: 'Use this one-time code to finish signing in to Cartify.',
  },
  password_reset: {
    subject: 'Reset your Cartify password',
    heading: 'Reset your password',
    intro: 'Use this one-time code to reset your Cartify password.',
  },
  '2fa_enable': {
    subject: 'Enable two-factor authentication',
    heading: 'Enable two-factor authentication',
    intro: 'Use this one-time code to enable email two-factor authentication.',
  },
  '2fa_disable': {
    subject: 'Disable two-factor authentication',
    heading: 'Disable two-factor authentication',
    intro: 'Use this one-time code to disable email two-factor authentication.',
  },
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function buildOtpEmail({ name, code, purpose, expiresMinutes }) {
  const copy = purposeCopy[purpose] ?? purposeCopy.email_verify
  const safeName = escapeHtml(name || 'there')
  const safeCode = escapeHtml(code)
  const text = [
    `Hi ${name || 'there'},`,
    '',
    copy.intro,
    '',
    `Your code: ${code}`,
    '',
    `This code expires in ${expiresMinutes} minutes. If you did not request it, you can ignore this email.`,
    '',
    'Cartify',
  ].join('\n')

  const html = `
  <div style="background:#f5f5f4;padding:32px 16px;font-family:Segoe UI,Arial,sans-serif;color:#292524">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:18px;padding:32px">
      <p style="margin:0 0 20px;font-size:13px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#57534e">CARTIFY</p>
      <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;color:#292524">${copy.heading}</h1>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#57534e">Hi ${safeName},</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#57534e">${copy.intro}</p>
      <div style="margin:0 0 24px;padding:18px;border-radius:12px;background:#efeeec;text-align:center">
        <span style="font-size:34px;font-weight:700;letter-spacing:10px;color:#292524">${safeCode}</span>
      </div>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#78716c">This code expires in ${expiresMinutes} minutes. If you did not request it, you can safely ignore this email.</p>
      <p style="margin:24px 0 0;font-size:13px;color:#78716c">Cartify - everyday essentials, thoughtfully curated.</p>
    </div>
  </div>`

  return { subject: copy.subject, text, html }
}

function createSmtpTransport({ host, port, secure, user, pass }) {
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

export function createEmailMailer(options = {}) {
  const smtpUser = options.smtpUser ?? env.SMTP_USER
  const smtpPass = options.smtpPass ?? env.SMTP_PASS
  const smtpHost = options.smtpHost ?? env.SMTP_HOST
  const smtpPort = options.smtpPort ?? env.SMTP_PORT
  const smtpSecure = options.smtpSecure ?? env.SMTP_SECURE
  const apiKey = options.apiKey ?? env.BREVO_API_KEY
  const senderEmail = options.senderEmail ?? env.BREVO_SENDER_EMAIL
  const senderName = options.senderName ?? env.BREVO_SENDER_NAME
  const smtpTransport =
    options.transport ??
    (smtpUser && smtpPass
      ? createSmtpTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass,
        })
      : null)

  async function sendWithSmtp({ to, subject, text, html }) {
    try {
      const info = await smtpTransport.sendMail({
        from: { name: senderName, address: senderEmail },
        to,
        subject,
        text,
        html,
      })
      return {
        messageId: info.messageId,
        response: info.response,
      }
    } catch (error) {
      throw new ApiError(
        502,
        `Brevo SMTP delivery failed. ${error.message}`,
        { code: 'EMAIL_DELIVERY_FAILED' },
      )
    }
  }

  async function sendWithApi({ to, subject, text, html }) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new ApiError(
        502,
        `Brevo email delivery failed (${response.status}).${body ? ` ${body.slice(0, 200)}` : ''}`,
        { code: 'EMAIL_DELIVERY_FAILED' },
      )
    }

    return response.json().catch(() => ({}))
  }

  async function send({ to, subject, text, html }) {
    if (smtpTransport) {
      return sendWithSmtp({ to, subject, text, html })
    }

    if (!apiKey) {
      throw new ApiError(
        503,
        'Email delivery is not configured. Set SMTP_USER and SMTP_PASS (recommended), or BREVO_API_KEY, plus a verified BREVO_SENDER_EMAIL in backend/.env.',
        { code: 'EMAIL_NOT_CONFIGURED' },
      )
    }

    return sendWithApi({ to, subject, text, html })
  }

  return {
    async sendOtpEmail({ to, name, code, purpose, expiresMinutes }) {
      const content = buildOtpEmail({
        name,
        code,
        purpose,
        expiresMinutes,
      })
      return send({ to, ...content })
    },
    send,
  }
}

export const createBrevoMailer = createEmailMailer

const emailMailer = createEmailMailer()
let activeMailer = emailMailer

export function setMailer(mailer) {
  activeMailer = mailer ?? emailMailer
}

export function getMailer() {
  return activeMailer
}
