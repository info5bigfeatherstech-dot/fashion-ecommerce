import { API_ENDPOINTS } from '@/api/endpoints'
import { adminGet, adminPut, unwrapAdmin } from './client'

const DEFAULT_LABEL = 'Sale is live'
const DEFAULT_HREF = '/shop/sale'
const DEFAULT_TAG = 'on-sale'

function normalizeSaleLive(raw = {}) {
  const label = String(raw.label || '').trim() || DEFAULT_LABEL
  const enabled = Boolean(raw.enabled)
  return {
    enabled,
    label,
    href: String(raw.href || DEFAULT_HREF).trim() || DEFAULT_HREF,
    tag: String(raw.tag || DEFAULT_TAG).trim() || DEFAULT_TAG,
    visible: Boolean(raw.visible ?? (enabled && label)),
    updatedAt: raw.updatedAt || null,
  }
}

/**
 * GET /api/admin/marketing/sale-live
 */
export async function getAdminSaleLiveSettings({ signal } = {}) {
  const payload = await adminGet(API_ENDPOINTS.admin.saleLiveSettings, { signal })
  const unwrapped = unwrapAdmin(payload)
  const raw =
    unwrapped?.saleLive && typeof unwrapped.saleLive === 'object'
      ? unwrapped.saleLive
      : payload?.saleLive && typeof payload.saleLive === 'object'
        ? payload.saleLive
        : {}
  return normalizeSaleLive(raw)
}

/**
 * PUT /api/admin/marketing/sale-live
 * body: { enabled?, label? }
 */
export async function updateAdminSaleLiveSettings(body = {}) {
  const payload = await adminPut(API_ENDPOINTS.admin.saleLiveSettings, body)
  const unwrapped = unwrapAdmin(payload)
  const raw =
    unwrapped?.saleLive && typeof unwrapped.saleLive === 'object'
      ? unwrapped.saleLive
      : payload?.saleLive && typeof payload.saleLive === 'object'
        ? payload.saleLive
        : {}
  return normalizeSaleLive(raw)
}
