import { API_ENDPOINTS } from '@/api/endpoints'
import { adminGet, adminGetBlob, downloadBlob, unwrapAdmin } from './client'

export async function getAdminUsers({ signal, page = 1, limit = 20, search = '', role = '' } = {}) {
  const params = { page, limit }
  if (String(search || '').trim()) params.search = String(search).trim()
  if (role) params.role = role
  const payload = await adminGet(API_ENDPOINTS.admin.users, { signal, params })
  return payload
}

export async function getAdminUserDetail(userId, { signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.userById(userId), { signal })
  return unwrapAdmin(payload)
}

export async function getAdminCarts({ signal, page = 1, limit = 20 } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.carts, {
    signal,
    params: { page, limit, sortBy: 'updatedAt', order: 'desc' },
  })
  return payload
}

export async function getAdminAbandonedCarts({ signal, page = 1, limit = 20, hours = 24 } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.cartsAbandoned, {
    signal,
    params: { page, limit, hours },
  })
  return payload
}

export async function getAdminHighValueCarts({ signal, page = 1, limit = 20, minAmount = 5000 } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.cartsHighValue, {
    signal,
    params: { page, limit, minAmount },
  })
  return payload
}

export async function getAdminWishlists({ signal, page = 1, limit = 20 } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.wishlists, {
    signal,
    params: { page, limit, sortBy: 'updatedAt', order: 'desc' },
  })
  return payload
}

export async function getAdminStaleWishlists({ signal, page = 1, limit = 20, days = 7 } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.wishlistsStale, {
    signal,
    params: { page, limit, days },
  })
  return payload
}

export async function getAdminPopularWishlistProducts({ signal, limit = 20 } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.wishlistsPopular, {
    signal,
    params: { limit },
  })
  return unwrapAdmin(payload)
}

export async function getAdminDashboardSummary({ signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.dashboardSummary, { signal })
  return unwrapAdmin(payload)
}

export async function exportAdminUsers({ search = '', role = '' } = {}) {
  const params = {}
  if (String(search || '').trim()) params.search = String(search).trim()
  if (role) params.role = role
  const response = await adminGetBlob(API_ENDPOINTS.admin.usersExport, { params })
  const today = new Date().toISOString().slice(0, 10)
  downloadBlob(response.data, `customers_export_${today}.xlsx`)
}
