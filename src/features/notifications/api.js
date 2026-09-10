import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'

export async function fetchUnreadNotificationCount() {
  const res = await http.get(API_ENDPOINTS.notifications.unreadCount)
  return Number(res?.data?.count ?? res?.count ?? 0) || 0
}

export async function fetchNotifications({ page = 1, limit = 25 } = {}) {
  const res = await http.get(API_ENDPOINTS.notifications.list, {
    params: { page, limit },
  })
  return {
    notifications: res?.data?.notifications || res?.notifications || [],
    pagination: res?.data?.pagination || res?.pagination || {},
  }
}

export async function markNotificationRead(id) {
  return http.patch(API_ENDPOINTS.notifications.markRead(id))
}

export async function markAllNotificationsRead() {
  return http.patch(API_ENDPOINTS.notifications.markAllRead)
}
