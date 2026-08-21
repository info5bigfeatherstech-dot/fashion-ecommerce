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

/** @deprecated Access token is memory-only in Zustand — kept for cleanup only */
export function getAuthToken() {
  return null
}

/** @deprecated */
export function setAuthToken() {
  // no-op: access token lives in Zustand memory
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(apiConfig.userStorageKey)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user) {
  if (!user) {
    localStorage.removeItem(apiConfig.userStorageKey)
    return
  }
  localStorage.setItem(apiConfig.userStorageKey, JSON.stringify(user))
}

/** Clears legacy localStorage auth keys (token is no longer persisted). */
export function clearAuthSession() {
  try {
    localStorage.removeItem(apiConfig.tokenStorageKey)
    localStorage.removeItem(apiConfig.userStorageKey)
  } catch {
    // ignore
  }
}
