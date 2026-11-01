import { roundMoney } from '../utils/money.js'

export const EXPRESS_SURCHARGE = 12.95

export const DELIVERY_METHODS = [
  {
    id: 'standard',
    label: 'Standard delivery',
    description: '5-7 business days',
    surcharge: 0,
  },
  {
    id: 'express',
    label: 'Express delivery',
    description: '2-3 business days',
    surcharge: EXPRESS_SURCHARGE,
  },
]

export function getDeliveryMethod(id) {
  return (
    DELIVERY_METHODS.find((method) => method.id === id) ?? DELIVERY_METHODS[0]
  )
}

export function getDeliveryShipping(id, standardShipping) {
  const method = getDeliveryMethod(id)
  return roundMoney((Number(standardShipping) || 0) + method.surcharge)
}
