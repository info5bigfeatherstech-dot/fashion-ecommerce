import axiosClient from './axiosClient'
import { normalizeApiError } from './errors'
import { useAppStore } from '@/store'
import { refreshSession } from '@/features/auth/api'

let interceptorsInstalled = false

export function setupInterceptors() {
  if (interceptorsInstalled) return
  interceptorsInstalled = true

  axiosClient.interceptors.request.use(
    (config) => {
      const token = useAppStore.getState().accessToken
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(normalizeApiError(error))
  )

  axiosClient.interceptors.response.use(
    (response) => {
      const payload = response.data
      if (payload && typeof payload === 'object' && payload.success === false) {
        return Promise.reject(
          normalizeApiError({
            response: {
              status: response.status,
              data: payload,
            },
            message: payload.message || 'Request failed',
          })
        )
      }
      return response
    },
    async (error) => {
      const original = error.config
      const status = error.response?.status
      const skipRefresh = original?.skipAuthRefresh || original?._retry

      if (status === 401 && original && !skipRefresh) {
        original._retry = true
        try {
          const session = await refreshSession()
          original.headers = original.headers || {}
          original.headers.Authorization = `Bearer ${session.accessToken}`
          return axiosClient(original)
        } catch (refreshError) {
          useAppStore.getState().clearUser()
          return Promise.reject(normalizeApiError(refreshError))
        }
      }

      return Promise.reject(normalizeApiError(error))
    }
  )
}
