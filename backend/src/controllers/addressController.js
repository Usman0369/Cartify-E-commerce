import { Address } from '../models/Address.js'
import { notFound } from '../utils/ApiError.js'
import { sendCreated, sendSuccess } from '../utils/response.js'
import { serializeAddress } from '../utils/serializers.js'

async function ensureDefault(userId, addressId = null) {
  const count = await Address.countDocuments({ user: userId })
  if (count === 0) return

  const hasDefault = await Address.exists({ user: userId, isDefault: true })
  if (!hasDefault) {
    const fallback =
      addressId
        ? await Address.findOne({ _id: addressId, user: userId })
        : await Address.findOne({ user: userId }).sort({ createdAt: 1 })
    if (fallback) {
      fallback.isDefault = true
      await fallback.save()
    }
  }
}

export async function listAddresses(req, res, next) {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    })
    return sendSuccess(res, { addresses: addresses.map(serializeAddress) })
  } catch (error) {
    return next(error)
  }
}

export async function createAddress(req, res, next) {
  try {
    const data = req.body
    if (data.isDefault) {
      await Address.updateMany(
        { user: req.user._id },
        { $set: { isDefault: false } },
      )
    }

    const count = await Address.countDocuments({ user: req.user._id })
    const address = await Address.create({
      ...data,
      user: req.user._id,
      isDefault: data.isDefault || count === 0,
    })

    return sendCreated(res, { address: serializeAddress(address) })
  } catch (error) {
    return next(error)
  }
}

export async function updateAddress(req, res, next) {
  try {
    const address = await Address.findOne({
      _id: req.params.addressId,
      user: req.user._id,
    })
    if (!address) throw notFound('Address not found.', 'ADDRESS_NOT_FOUND')

    if (req.body.isDefault === true) {
      await Address.updateMany(
        { user: req.user._id },
        { $set: { isDefault: false } },
      )
    }

    Object.assign(address, req.body)
    await address.save()
    await ensureDefault(req.user._id, address._id)

    return sendSuccess(res, { address: serializeAddress(address) })
  } catch (error) {
    return next(error)
  }
}

export async function deleteAddress(req, res, next) {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.addressId,
      user: req.user._id,
    })
    if (!address) throw notFound('Address not found.', 'ADDRESS_NOT_FOUND')

    await ensureDefault(req.user._id)
    return sendSuccess(res, null, 200, 'Address removed.')
  } catch (error) {
    return next(error)
  }
}

export async function setDefaultAddress(req, res, next) {
  try {
    const address = await Address.findOne({
      _id: req.params.addressId,
      user: req.user._id,
    })
    if (!address) throw notFound('Address not found.', 'ADDRESS_NOT_FOUND')

    await Address.updateMany(
      { user: req.user._id },
      { $set: { isDefault: false } },
    )
    address.isDefault = true
    await address.save()

    return sendSuccess(res, { address: serializeAddress(address) })
  } catch (error) {
    return next(error)
  }
}
