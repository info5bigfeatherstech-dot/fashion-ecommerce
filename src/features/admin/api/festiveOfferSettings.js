import { API_ENDPOINTS } from '@/api/endpoints'
import { adminGet, adminPut, unwrapAdmin } from './client'

/**
 * GET /api/admin/marketing/festive-offer
 */
export async function getAdminFestiveOfferSettings({ signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.festiveOfferSettings, { signal })
  const unwrapped = unwrapAdmin(payload)
  const raw =
    unwrapped?.festiveOffer && typeof unwrapped.festiveOffer === 'object'
      ? unwrapped.festiveOffer
      : payload?.festiveOffer && typeof payload.festiveOffer === 'object'
        ? payload.festiveOffer
        : {}
  return {
    enabled: Boolean(raw.enabled),
    label: String(raw.label || '').trim() || 'Festive Offers',
    href: String(raw.href || '/shop/festive').trim() || '/shop/festive',
    tag: String(raw.tag || 'festive-offer').trim() || 'festive-offer',
    visible: Boolean(raw.visible),
    updatedAt: raw.updatedAt || null,
  }
}

/**
 * PUT /api/admin/marketing/festive-offer
 * body: { enabled?, label? }
 */
export async function updateAdminFestiveOfferSettings(body = {}) {
  const payload = await adminPut(API_ENDPOINTS.admin.festiveOfferSettings, body)
  const unwrapped = unwrapAdmin(payload)
  const raw =
    unwrapped?.festiveOffer && typeof unwrapped.festiveOffer === 'object'
      ? unwrapped.festiveOffer
      : payload?.festiveOffer && typeof payload.festiveOffer === 'object'
        ? payload.festiveOffer
        : {}
  return {
    enabled: Boolean(raw.enabled),
    label: String(raw.label || '').trim() || 'Festive Offers',
    href: String(raw.href || '/shop/festive').trim() || '/shop/festive',
    tag: String(raw.tag || 'festive-offer').trim() || 'festive-offer',
    visible: Boolean(raw.visible),
    updatedAt: raw.updatedAt || null,
  }
}
