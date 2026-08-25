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
