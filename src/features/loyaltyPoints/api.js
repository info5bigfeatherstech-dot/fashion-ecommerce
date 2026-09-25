import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'

export async function getMyLoyaltyPoints({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.loyaltyPoints.me, { signal })
  return {
    success: payload?.success !== false,
    points: payload?.points || null,
  }
}

export async function getMyLoyaltyLedger({ signal, page = 1, limit = 20 } = {}) {
  const payload = await http.get(API_ENDPOINTS.loyaltyPoints.ledger, {
    signal,
    params: { page, limit },
  })
  return {
    success: payload?.success !== false,
    items: Array.isArray(payload?.items) ? payload.items : [],
    total: Number(payload?.total) || 0,
    page: Number(payload?.page) || page,
    limit: Number(payload?.limit) || limit,
  }
}

export async function getPublicLoyaltyPointsSettings({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.loyaltyPoints.settings, { signal })
  return {
    success: payload?.success !== false,
    settings: payload?.settings || null,
  }
}
