export const ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
}

export const ORDER_STATUSES = [
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Refunded',
]

export const OTP_PURPOSES = {
  EMAIL_VERIFY: 'email_verify',
  LOGIN_2FA: 'login_2fa',
  PASSWORD_RESET: 'password_reset',
  TWO_FACTOR_ENABLE: '2fa_enable',
  TWO_FACTOR_DISABLE: '2fa_disable',
}

export const DELIVERY_METHODS = {
  standard: {
    id: 'standard',
    label: 'Standard delivery',
    description: '5-7 business days',
    surcharge: 0,
  },
  express: {
    id: 'express',
    label: 'Express delivery',
    description: '2-3 business days',
    surcharge: 12.95,
  },
}

export const DELIVERY_METHOD_LIST = Object.values(DELIVERY_METHODS)

export const FREE_SHIPPING_THRESHOLD = 75
export const STANDARD_SHIPPING_RATE = 6.95
export const PROMO_CODE = 'WARM20'
export const PROMO_DISCOUNT_RATE = 0.2
