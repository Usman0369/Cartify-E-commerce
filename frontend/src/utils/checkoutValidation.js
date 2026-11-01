import {
  isValidCardNumber,
  isValidCvc,
  isValidExpiry,
  isValidPhone,
} from './payment.js'
import { isValidEmail, required } from './validation.js'

export const CHECKOUT_FIELD_ORDER = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'address1',
  'city',
  'region',
  'postalCode',
  'country',
  'cardName',
  'cardNumber',
  'expiry',
  'cvc',
]

export function validateCheckout(values = {}) {
  const errors = {}
  const value = (name) => String(values[name] ?? '').trim()

  if (!required(value('firstName'))) {
    errors.firstName = 'First name is required.'
  }

  if (!required(value('lastName'))) {
    errors.lastName = 'Last name is required.'
  }

  if (!required(value('email'))) {
    errors.email = 'Email address is required.'
  } else if (!isValidEmail(value('email'))) {
    errors.email = 'Enter a valid email address.'
  }

  if (!required(value('phone'))) {
    errors.phone = 'Phone number is required.'
  } else if (!isValidPhone(value('phone'))) {
    errors.phone = 'Enter a valid phone number.'
  }

  if (!required(value('address1'))) {
    errors.address1 = 'Address line 1 is required.'
  }

  if (!required(value('city'))) {
    errors.city = 'City is required.'
  }

  if (!required(value('region'))) {
    errors.region = 'State or region is required.'
  }

  if (!required(value('postalCode'))) {
    errors.postalCode = 'Postal code is required.'
  }

  if (!required(value('country'))) {
    errors.country = 'Country is required.'
  }

  if (!required(value('cardName'))) {
    errors.cardName = 'Cardholder name is required.'
  }

  if (!required(value('cardNumber'))) {
    errors.cardNumber = 'Card number is required.'
  } else if (!isValidCardNumber(value('cardNumber'))) {
    errors.cardNumber = 'Enter a valid card number.'
  }

  if (!required(value('expiry'))) {
    errors.expiry = 'Expiry date is required.'
  } else if (!isValidExpiry(value('expiry'))) {
    errors.expiry = 'Enter a valid expiry date (MM/YY).'
  }

  if (!required(value('cvc'))) {
    errors.cvc = 'Security code is required.'
  } else if (!isValidCvc(value('cvc'))) {
    errors.cvc = 'Enter a valid security code.'
  }

  return errors
}
