import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'

export async function getPublicReferralSettings({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.referral.settings, { signal })
  return {
    success: payload?.success !== false,
    settings: payload?.settings || null,
  }
}

function mapLedgerItem(row) {
  if (!row || typeof row !== 'object') return null
  const type = String(row.type || 'adjust')
  const hidesRefereeOrder = type === 'referral_reward' || type === 'referral_clawback'
  return {
    id: String(row.id || row._id || ''),
    type,
    points: Math.trunc(Number(row.points) || 0),
    orderId: hidesRefereeOrder ? null : row.orderId || null,
    rupeeValue: Math.max(0, Number(row.rupeeValue) || 0),
    note: row.note || '',
    createdAt: row.createdAt || null,
  }
}

function mapActivityItem(row) {
  if (!row || typeof row !== 'object') return null
  return {
    id: String(row.id || row._id || ''),
    status: String(row.status || ''),
    points: Math.max(0, Math.floor(Number(row.points) || 0)),
    pointsPending: Math.max(0, Math.floor(Number(row.pointsPending) || 0)),
    refereeName: String(row.refereeName || '').trim() || 'Customer',
    skipMessage: row.skipMessage ? String(row.skipMessage) : null,
    createdAt: row.createdAt || null,
    completedAt: row.completedAt || null,
  }
}

function mapMyReferral(payload) {
  const wallet = payload?.wallet && typeof payload.wallet === 'object' ? payload.wallet : {}
  const ledger = payload?.ledger && typeof payload.ledger === 'object' ? payload.ledger : {}
  const stats = payload?.stats || {}
  return {
    success: payload?.success !== false,
    settings: payload?.settings || null,
    code: payload?.code || null,
    stats: {
      completedUses: Math.max(0, Math.floor(Number(stats.completedUses) || 0)),
      pendingUses: Math.max(0, Math.floor(Number(stats.pendingUses) || 0)),
      pointsAwarded: Math.max(0, Math.floor(Number(stats.pointsAwarded) || 0)),
      pointsUsed: Math.max(0, Math.floor(Number(stats.pointsUsed) || 0)),
    },
    wallet: {
      balance: Math.max(0, Math.floor(Number(wallet.balance) || 0)),
      lifetimeEarned: Math.max(0, Math.floor(Number(wallet.lifetimeEarned) || 0)),
      lifetimeRedeemed: Math.max(0, Math.floor(Number(wallet.lifetimeRedeemed) || 0)),
      approxInr: Math.max(0, Number(wallet.approxInr) || 0),
      usedApproxInr: Math.max(0, Number(wallet.usedApproxInr) || 0),
      redeemRupeePerPoint: Math.max(0, Number(wallet.redeemRupeePerPoint) || 0),
      loyaltyEnabled: Boolean(wallet.loyaltyEnabled),
      canRedeem: Boolean(wallet.canRedeem),
    },
    activity: Array.isArray(payload?.activity)
      ? payload.activity.map(mapActivityItem).filter(Boolean)
      : [],
    ledger: {
      items: Array.isArray(ledger.items) ? ledger.items.map(mapLedgerItem).filter(Boolean) : [],
      total: Math.max(0, Math.floor(Number(ledger.total) || 0)),
      failed: Boolean(ledger.failed),
    },
    alreadyUsedAsReferee: Boolean(payload?.alreadyUsedAsReferee),
  }
}

export async function getMyReferral({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.referral.me, { signal })
  return mapMyReferral(payload)
}

export async function generateMyReferral() {
  const payload = await http.post(API_ENDPOINTS.referral.generate, {})
  return mapMyReferral(payload)
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
