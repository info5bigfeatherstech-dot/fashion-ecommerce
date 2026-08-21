import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'
import { mapAddress, toAddressPayload } from './mappers'

const META_ONLY_KEYS = new Set(['isDefault', 'isGift', 'addressType', 'deliveryInstructions'])

export async function listAddresses({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.addresses.list, { signal })
  const defaultAddress = mapAddress(payload?.defaultAddress)
  const others = Array.isArray(payload?.addresses)
    ? payload.addresses.map(mapAddress).filter(Boolean)
    : []

  const addresses = [
    ...(defaultAddress ? [defaultAddress] : []),
    ...others.filter((addr) => addr.id !== defaultAddress?.id),
  ]

  return {
    count: payload?.count ?? addresses.length,
    scope: payload?.scope || 'ecomm',
    defaultAddress,
    addresses: others,
    all: addresses,
  }
}

export async function createAddress(form) {
  const payload = await http.post(
    API_ENDPOINTS.addresses.create,
    toAddressPayload(form)
  )

  return {
    message: payload?.message || 'Address added successfully',
    address: mapAddress(payload?.address),
    duplicated: String(payload?.message || '').toLowerCase().includes('already exists'),
  }
}

export async function updateAddress(id, patch = {}) {
  const keys = Object.keys(patch)
  const metaOnly = keys.length > 0 && keys.every((key) => META_ONLY_KEYS.has(key))
  const data = metaOnly ? patch : toAddressPayload(patch)

  const payload = await http.put(API_ENDPOINTS.addresses.byId(id), data)

  return {
    message: payload?.message || 'Address updated successfully',
    address: mapAddress(payload?.address),
  }
}

export async function deleteAddress(id) {
  const payload = await http.delete(API_ENDPOINTS.addresses.byId(id))
  return {
    message: payload?.message || 'Address deleted successfully',
  }
}

export async function setDefaultAddress(id) {
  return updateAddress(id, { isDefault: true })
}
