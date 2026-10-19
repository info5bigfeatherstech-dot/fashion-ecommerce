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

/**
 * Public sale-live badge config for the storefront header.
 * GET /api/marketing/sale-live
 * Fail-open: on network/API errors keep the historic always-on badge.
 */
export async function getPublicSaleLive({ signal } = {}) {
  const fallback = {
    enabled: true,
    label: 'Sale is live',
    href: '/shop/sale',
    tag: 'on-sale',
    visible: true,
  }
  try {
    const payload = await http.get(API_ENDPOINTS.marketing.saleLive, { signal })
    const raw = payload?.saleLive && typeof payload.saleLive === 'object' ? payload.saleLive : {}
    const label = String(raw.label || '').trim() || fallback.label
    const enabled = Object.prototype.hasOwnProperty.call(raw, 'enabled')
      ? Boolean(raw.enabled)
      : true
    return {
      enabled,
      label,
      href: String(raw.href || fallback.href).trim() || fallback.href,
      tag: String(raw.tag || fallback.tag).trim() || fallback.tag,
      visible: Boolean(raw.visible ?? (enabled && label)),
    }
  } catch {
    return fallback
  }
}
