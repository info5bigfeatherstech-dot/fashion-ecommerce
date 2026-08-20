import axiosClient from './axiosClient'
import { getAuthToken } from './config'
import { normalizeApiError } from './errors'

let interceptorsInstalled = false

export function setupInterceptors() {
  if (interceptorsInstalled) return
  interceptorsInstalled = true

  axiosClient.interceptors.request.use(
    (config) => {
      const token = getAuthToken()
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
    (error) => Promise.reject(normalizeApiError(error))
  )
}
