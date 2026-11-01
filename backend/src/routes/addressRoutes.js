import { Router } from 'express'
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from '../controllers/addressController.js'
import { protect } from '../middleware/auth.js'
import { writeLimiter } from '../middleware/rateLimits.js'
import { validate } from '../middleware/validate.js'
import { addressSchema, updateAddressSchema } from '../validators/address.js'

export const addressRouter = Router()

addressRouter.use(protect)

addressRouter.get('/', listAddresses)
addressRouter.post('/', writeLimiter, validate(addressSchema), createAddress)
addressRouter.patch(
  '/:addressId',
  writeLimiter,
  validate(updateAddressSchema),
  updateAddress,
)
addressRouter.delete('/:addressId', writeLimiter, deleteAddress)
addressRouter.post('/:addressId/default', writeLimiter, setDefaultAddress)
