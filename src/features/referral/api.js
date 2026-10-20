import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'

export async function getPublicReferralSettings({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.referral.settings, { signal })
  return {
    success: payload?.success !== false,
    settings: payload?.settings || null,
  }
}

export async function getMyReferral({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.referral.me, { signal })
  return {
    success: payload?.success !== false,
    settings: payload?.settings || null,
    code: payload?.code || null,
    stats: payload?.stats || { completedUses: 0, pendingUses: 0, pointsAwarded: 0 },
    alreadyUsedAsReferee: Boolean(payload?.alreadyUsedAsReferee),
  }
}

export async function generateMyReferral() {
  const payload = await http.post(API_ENDPOINTS.referral.generate, {})
  return {
    success: payload?.success !== false,
    settings: payload?.settings || null,
    code: payload?.code || null,
    stats: payload?.stats || { completedUses: 0, pendingUses: 0, pointsAwarded: 0 },
    alreadyUsedAsReferee: Boolean(payload?.alreadyUsedAsReferee),
  }
}

export async function validateReferral({ code, useServercart = true, subtotal } = {}) {
  const body = {
    code: String(code || '').trim(),
    useServercart: Boolean(useServercart),
  }
  if (!useServercart && subtotal != null) {
    body.subtotal = Number(subtotal)
  }
  const payload = await http.post(API_ENDPOINTS.referral.validate, body)
  return {
    success: payload?.success !== false,
    valid: payload?.valid !== false && payload?.success !== false,
    kind: 'referral',
    code: payload?.code || String(code || '').trim().toUpperCase(),
    discount: Number(payload?.discount) || 0,
    discountType: payload?.discountType || 'percentage',
    discountValue: Number(payload?.discountValue) || 0,
    message: payload?.message || 'Referral applied',
  }
}
