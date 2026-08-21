import axiosClient from './axiosClient'

function compactParams(params) {
  if (!params) return undefined

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null || value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      return true
    })
  )
}

function request(method, url, { params, data, signal, headers, timeout, skipAuthRefresh } = {}) {
  return axiosClient.request({
    method,
    url,
    params: compactParams(params),
    data,
    signal,
    headers,
    timeout,
    skipAuthRefresh: Boolean(skipAuthRefresh),
  }).then((response) => response.data)
}

export const http = {
  get: (url, options) => request('GET', url, options),
  post: (url, data, options) => request('POST', url, { ...options, data }),
  put: (url, data, options) => request('PUT', url, { ...options, data }),
  patch: (url, data, options) => request('PATCH', url, { ...options, data }),
  delete: (url, options) => request('DELETE', url, options),
}
