const TOKEN_STORAGE_KEY = 'verao_token'
const USER_STORAGE_KEY = 'verao_user'

function trimSlash(value) {
  return String(value || '').replace(/\/+$/, '')
}

function resolveBaseUrl() {
  const fromEnv = trimSlash(import.meta.env.VITE_API_BASE_URL)
  if (fromEnv) return fromEnv
  if (import.meta.env.DEV) return '/api'
  return 'https://owbtu.onrender.com/api'
}

export const apiConfig = {
  baseURL: resolveBaseUrl(),
  timeoutMs: 45_000,
  tokenStorageKey: TOKEN_STORAGE_KEY,
  userStorageKey: USER_STORAGE_KEY,
}

export function getAuthToken() {
  try {
    return localStorage.getItem(apiConfig.tokenStorageKey)
  } catch {
    return null
  }
}

export function setAuthToken(token) {
  if (!token) {
    localStorage.removeItem(apiConfig.tokenStorageKey)
    return
  }
  localStorage.setItem(apiConfig.tokenStorageKey, token)
}

export function clearAuthSession() {
  localStorage.removeItem(apiConfig.tokenStorageKey)
  localStorage.removeItem(apiConfig.userStorageKey)
}
