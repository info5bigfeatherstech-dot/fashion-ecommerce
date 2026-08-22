import { http } from '@/api/http'

/** Unwrap `{ success, data }` envelopes from admin APIs. */
export function unwrapAdmin(payload) {
  if (payload?.data != null && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    if (payload.success === false) return payload
    return payload.data
  }
  return payload
}

export function adminGet(url, options = {}) {
  return http.get(url, { ...options, useAdminAuth: true })
}

export function adminPost(url, body, options = {}) {
  return http.post(url, body, { ...options, useAdminAuth: true })
}

export function adminPut(url, body, options = {}) {
  return http.put(url, body, { ...options, useAdminAuth: true })
}

export function adminPatch(url, body, options = {}) {
  return http.patch(url, body, { ...options, useAdminAuth: true })
}

export function adminDelete(url, options = {}) {
  return http.delete(url, { ...options, useAdminAuth: true })
}
