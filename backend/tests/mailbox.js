export const mailbox = []

export const fakeMailer = {
  async sendOtpEmail(message) {
    mailbox.push({
      ...message,
      capturedAt: new Date(),
    })
  },
}

export function latestOtp(email, purpose) {
  const normalized = String(email).toLowerCase()
  return [...mailbox]
    .reverse()
    .find(
      (message) =>
        String(message.to).toLowerCase() === normalized &&
        message.purpose === purpose,
    )
}

export function latestCode(email, purpose) {
  return latestOtp(email, purpose)?.code
}

export function clearMailbox() {
  mailbox.length = 0
}
