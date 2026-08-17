import axiosClient from './axiosClient'

export function setupInterceptors() {
  axiosClient.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('verao_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const normalized = {
        message: error.response?.data?.message || error.message || 'Something went wrong',
        status: error.response?.status || 500,
        code: error.response?.data?.code || 'UNKNOWN_ERROR',
      }
      return Promise.reject(normalized)
    }
  )
}
