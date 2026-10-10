import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'

/**
 * Public festive badge config for the storefront header.
 * GET /api/marketing/festive-offer
 */
export async function getPublicFestiveOffer({ signal } = {}) {
  try {
    const payload = await http.get(API_ENDPOINTS.marketing.festiveOffer, { signal })
    const raw = payload?.festiveOffer && typeof payload.festiveOffer === 'object'
      ? payload.festiveOffer
      : {}
    const label = String(raw.label || '').trim()
    const enabled = Boolean(raw.enabled)
    return {
      enabled,
      label,
      href: String(raw.href || '/shop/festive').trim() || '/shop/festive',
      tag: String(raw.tag || 'festive-offer').trim() || 'festive-offer',
      visible: Boolean(raw.visible ?? (enabled && label)),
    }
  } catch {
    return {
      enabled: false,
      label: '',
      href: '/shop/festive',
      tag: 'festive-offer',
      visible: false,
    }
  }
}
