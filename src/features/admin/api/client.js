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

/** Download binary admin responses (CSV/XLSX/ZIP). */
export async function adminGetBlob(url, options = {}) {
  const axiosClient = (await import('@/api/axiosClient')).default
  const response = await axiosClient.request({
    method: 'GET',
    url,
    params: options.params,
    responseType: 'blob',
    timeout: options.timeout ?? 120000,
    useAdminAuth: true,
    skipAuthRefresh: options.skipAuthRefresh,
  })
  return response
}

export async function adminPostBlob(url, body, options = {}) {
  const axiosClient = (await import('@/api/axiosClient')).default
  const response = await axiosClient.request({
    method: 'POST',
    url,
    data: body,
    responseType: 'blob',
    timeout: options.timeout ?? 120000,
    useAdminAuth: true,
    headers: options.headers,
  })
  return response
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    URL.revokeObjectURL(url)
  }
}
