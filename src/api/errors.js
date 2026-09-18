export class ApiError extends Error {
  constructor({
    message = 'Something went wrong',
    status = 500,
    code = 'UNKNOWN_ERROR',
    details = null,
    cause = null,
  } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.cause = cause
  }

  get isNotFound() {
    return this.status === 404
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isNetworkError() {
    return this.code === 'NETWORK_ERROR'
  }
}

export function normalizeApiError(error) {
  if (error instanceof ApiError) return error

  if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.name === 'AbortError') {
    return new ApiError({
      message: 'Request cancelled',
      status: 0,
      code: 'REQUEST_CANCELLED',
      cause: error,
    })
  }

  if (!error?.response) {
    // Axios aborts long requests with ECONNABORTED + "timeout of Xms exceeded"
    const rawMessage = String(error?.message || '')
    const isTimeout =
      error?.code === 'ECONNABORTED' ||
      error?.code === 'ETIMEDOUT' ||
      /timeout/i.test(rawMessage)

    if (isTimeout) {
      return new ApiError({
        message: rawMessage || 'Request timed out. Please try again.',
        status: 0,
        code: 'TIMEOUT',
        cause: error,
      })
    }

    return new ApiError({
      message: error?.message || 'Network error. Please try again.',
      status: 0,
      code: 'NETWORK_ERROR',
      cause: error,
    })
  }

  const data = error.response.data
  const message =
    data?.message ||
    data?.error ||
    error.message ||
    'Something went wrong'

  return new ApiError({
    message,
    status: error.response.status || 500,
    code: data?.code || data?.errorCode || 'API_ERROR',
    details: data,
    cause: error,
  })
}
