import { http } from '@/api/http'
import { API_ENDPOINTS, ADMIN_AUTH_PORTAL, STOREFRONT } from '@/api/endpoints'
import { useAdminStore, isAdminRole } from './store'

function mapAdminUser(user) {
  if (!user) return null
  return {
    id: user.id || user._id,
    name: user.name || '',
    email: user.email || '',
    role: user.role || '',
    phone: user.phone || '',
  }
}

function applyAdminSession(payload) {
  const user = mapAdminUser(payload?.user)
  if (!user || !isAdminRole(user.role)) {
    throw new Error('Access denied. Insufficient admin permissions.')
  }
  const accessToken = payload?.accessToken || null
  if (!accessToken) throw new Error('Login did not return an access token')
  useAdminStore.getState().setSession({ user, accessToken })
  return { user, accessToken }
}

let adminRefreshPromise = null

export async function refreshAdminSession() {
  if (!adminRefreshPromise) {
    adminRefreshPromise = http
      .post(
        API_ENDPOINTS.auth.refresh,
        { portal: ADMIN_AUTH_PORTAL },
        { skipAuthRefresh: true, useAdminAuth: true }
      )
      .then(async (payload) => {
        const accessToken = payload?.accessToken
        if (!accessToken) throw new Error('Admin refresh did not return an access token')

        useAdminStore.getState().setAccessToken(accessToken)

        let user = mapAdminUser(payload?.user)
        if (!user) {
          user = await fetchAdminMe()
        }

        useAdminStore.getState().setSession({ user, accessToken })
        return { user, accessToken }
      })
      .finally(() => {
        adminRefreshPromise = null
      })
  }
  return adminRefreshPromise
}

export async function fetchAdminMe() {
  const payload = await http.get(API_ENDPOINTS.auth.me, {
    skipAuthRefresh: true,
    useAdminAuth: true,
  })
  const user = mapAdminUser(payload?.user)
  if (!user || !isAdminRole(user.role)) {
    throw new Error('Insufficient admin role')
  }
  return user
}

export async function adminLogin({ identifier, email, password }) {
  const payload = await http.post(API_ENDPOINTS.auth.login, {
    identifier: identifier || email,
    password,
    portal: ADMIN_AUTH_PORTAL,
  }, { skipAuthRefresh: true })

  return {
    message: payload?.message || 'Login successful',
    ...applyAdminSession(payload),
  }
}

export async function adminLogout() {
  try {
    await http.post(API_ENDPOINTS.auth.logout, null, {
      skipAuthRefresh: true,
      useAdminAuth: true,
    })
  } catch {
    /* clear local session regardless */
  } finally {
    useAdminStore.getState().clearSession()
  }
}

export async function getAdminCheckoutSettings({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.checkout.adminSettings, {
    signal,
    useAdminAuth: true,
    headers: { 'X-Storefront': STOREFRONT },
  })
  return payload?.data || payload
}

export async function updateAdminCheckoutSettings(body) {
  const payload = await http.put(
    API_ENDPOINTS.checkout.adminSettings,
    body,
    {
      useAdminAuth: true,
      headers: { 'X-Storefront': STOREFRONT },
    }
  )
  return payload?.data || payload
}

export async function getAdminOrdersSummary({ signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.admin.ordersSummary, {
    signal,
    useAdminAuth: true,
    params: { rangePreset: 'all' },
  })
  return payload?.data || payload
}

export async function getAdminOrdersList({ signal, page = 1, limit = 20, bucket = 'Pending' } = {}) {
  const payload = await http.get(API_ENDPOINTS.admin.ordersList, {
    signal,
    useAdminAuth: true,
    params: { page, limit, bucket },
  })
  return payload
}

export async function getAdminOrderDetail(orderId, { signal } = {}) {
  const payload = await http.get(API_ENDPOINTS.admin.orderDetail(orderId), {
    signal,
    useAdminAuth: true,
  })
  return payload?.data || payload?.order || payload
}
