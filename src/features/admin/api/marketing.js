import { API_ENDPOINTS } from '@/api/endpoints'
import { adminDelete, adminGet, adminPatch, adminPost, adminPut, unwrapAdmin } from './client'

export async function getAdminCoupons({ signal, page = 1, limit = 20, status = 'all', search = '' } = {}) {
  const params = { page, limit }
  if (status && status !== 'all') params.status = status
  if (String(search || '').trim()) params.search = String(search).trim()
  const payload = await adminGet(API_ENDPOINTS.admin.coupons, { signal, params })
  return payload
}

export async function createAdminCoupon(body) {
  const payload = await adminPost(API_ENDPOINTS.admin.coupons, body)
  return unwrapAdmin(payload)
}

export async function updateAdminCoupon(id, body) {
  const payload = await adminPut(API_ENDPOINTS.admin.couponById(id), body)
  return unwrapAdmin(payload)
}

export async function deleteAdminCoupon(id) {
  const payload = await adminDelete(API_ENDPOINTS.admin.couponById(id))
  return unwrapAdmin(payload)
}

export async function toggleAdminCoupon(id) {
  const payload = await adminPatch(API_ENDPOINTS.admin.couponToggle(id))
  return unwrapAdmin(payload)
}

export async function getAdminLoyaltyBadges({ signal, status = 'all' } = {}) {
  const params = {}
  if (status && status !== 'all') params.status = status
  const payload = await adminGet(API_ENDPOINTS.admin.loyaltyBadges, { signal, params })
  return payload
}

export async function createAdminLoyaltyBadge(body) {
  const payload = await adminPost(API_ENDPOINTS.admin.loyaltyBadges, body)
  return unwrapAdmin(payload)
}

export async function updateAdminLoyaltyBadge(id, body) {
  const payload = await adminPut(API_ENDPOINTS.admin.loyaltyBadgeById(id), body)
  return unwrapAdmin(payload)
}

export async function deleteAdminLoyaltyBadge(id) {
  const payload = await adminDelete(API_ENDPOINTS.admin.loyaltyBadgeById(id))
  return unwrapAdmin(payload)
}

export async function toggleAdminLoyaltyBadge(id) {
  const payload = await adminPatch(API_ENDPOINTS.admin.loyaltyBadgeToggle(id))
  return unwrapAdmin(payload)
}

export async function getAdminLoyaltyPointsSettings({ signal, storefront = 'ecomm' } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.loyaltyPointsSettings, {
    signal,
    params: { storefront },
  })
  return payload
}

export async function updateAdminLoyaltyPointsSettings(body) {
  const payload = await adminPut(API_ENDPOINTS.admin.loyaltyPointsSettings, body)
  return unwrapAdmin(payload) || payload
}

export async function adjustAdminLoyaltyPoints(body) {
  const payload = await adminPost(API_ENDPOINTS.admin.loyaltyPointsAdjust, body)
  if (payload?.success === false) {
    const err = new Error(payload?.message || 'Adjust failed')
    err.code = payload?.code
    throw err
  }
  return payload
}

export async function getAdminLoyaltyBadgeMembers(
  id,
  { signal, page = 1, limit = 20, search = '' } = {}
) {
  const params = { page, limit }
  if (String(search || '').trim()) params.search = String(search).trim()
  const payload = await adminGet(API_ENDPOINTS.admin.loyaltyBadgeMembers(id), { signal, params })
  return payload
}

/** Recompute one customer loyalty by email and/or userId (heals missed auto-assign). */
export async function recomputeAdminLoyaltyUser({ email, userId } = {}) {
  const body = {}
  if (String(email || '').trim()) body.email = String(email).trim()
  if (String(userId || '').trim()) body.userId = String(userId).trim()
  const payload = await adminPost(API_ENDPOINTS.admin.loyaltyRecompute, body)
  if (payload?.success === false) {
    const err = new Error(payload?.message || 'Recompute failed')
    err.code = payload?.code
    throw err
  }
  // API returns loyalty/stats at top level (not under data)
  return payload
}

export async function getAdminStaff({ signal, page = 1, limit = 20, search = '', role = '' } = {}) {
  const params = { page, limit }
  if (String(search || '').trim()) params.search = String(search).trim()
  if (role) params.role = role
  const payload = await adminGet(API_ENDPOINTS.admin.staff, { signal, params })
  return unwrapAdmin(payload)
}

export async function getAdminStaffProfile({ signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.staffProfile, { signal })
  return unwrapAdmin(payload)
}

export async function initiateAdminSelfPasswordReset() {
  const payload = await adminPost(API_ENDPOINTS.admin.staffProfilePasswordResetInit, {})
  const inner = unwrapAdmin(payload)
  return {
    message: payload?.message || inner?.message || 'OTP sent to your email',
    maskedEmail: inner?.maskedEmail || null,
    expiresInSeconds: inner?.expiresInSeconds || 600,
  }
}

export async function verifyAdminSelfPasswordReset({ otp, newPassword, confirmPassword }) {
  const payload = await adminPost(API_ENDPOINTS.admin.staffProfilePasswordResetVerify, {
    otp,
    newPassword,
    confirmPassword,
  })
  const inner = unwrapAdmin(payload)
  return {
    message: payload?.message || inner?.message || 'Password updated successfully',
  }
}

export async function createAdminStaff(body) {
  const payload = await adminPost(API_ENDPOINTS.admin.staff, body)
  return unwrapAdmin(payload)
}

export async function updateAdminStaff(id, body) {
  const payload = await adminPut(API_ENDPOINTS.admin.staffById(id), body)
  return unwrapAdmin(payload)
}

export async function initiateAdminStaffPasswordReset(staffId) {
  const payload = await adminPost(API_ENDPOINTS.admin.staffInitiateReset(staffId), {})
  const inner = unwrapAdmin(payload)
  return {
    message: payload?.message || inner?.message || 'OTP sent to your email',
    maskedEmail: inner?.maskedEmail || null,
    expiresInSeconds: inner?.expiresInSeconds || 600,
  }
}

export async function verifyAdminStaffPasswordReset(staffId, { otp, newPassword }) {
  const payload = await adminPost(API_ENDPOINTS.admin.staffVerifyReset(staffId), {
    otp,
    newPassword,
  })
  const inner = unwrapAdmin(payload)
  return {
    message: payload?.message || inner?.message || 'Password reset successfully',
  }
}

export async function deleteAdminStaff(id) {
  const payload = await adminDelete(API_ENDPOINTS.admin.staffById(id))
  return unwrapAdmin(payload)
}

export async function getAdminOosInquiries({
  signal,
  page = 1,
  limit = 20,
  search = '',
  status = 'all',
  days = 30,
} = {}) {
  const params = { page, limit, days }
  if (String(search || '').trim()) params.search = String(search).trim()
  if (status && status !== 'all') params.status = status
  const payload = await adminGet(API_ENDPOINTS.admin.oosInquiries, { signal, params })
  return payload
}

export async function updateAdminOosInquiryStatus(id, { status, adminNote } = {}) {
  const payload = await adminPatch(API_ENDPOINTS.admin.oosInquiryStatus(id), {
    status,
    adminNote,
  })
  return unwrapAdmin(payload)
}
