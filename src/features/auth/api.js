import { http } from '@/api/http'
import { API_ENDPOINTS, AUTH_PORTAL } from '@/api/endpoints'
import { clearAuthSession } from '@/api/config'
import { syncBagsAfterLogin } from '@/features/commerce/syncBags'
import { useAppStore } from '@/store'

function mapAuthUser(user) {
  if (!user) return null

  const name = String(user.name || '').trim()
  const [firstName = '', ...rest] = name.split(/\s+/)

  return {
    id: user.id || user._id,
    name,
    firstName: user.firstName || firstName,
    lastName: user.lastName || rest.join(' '),
    email: user.email || '',
    phone: user.phone || '',
    userType: user.userType || 'user',
    role: user.role || 'user',
    status: user.status || null,
    isPhoneVerified: Boolean(user.isPhoneVerified),
    isEmailVerified: Boolean(user.isEmailVerified),
    isProfileComplete: Boolean(user.isProfileComplete),
  }
}

function applyLoginPayload(payload) {
  const user = mapAuthUser(payload?.user) || useAppStore.getState().user
  const accessToken = payload?.accessToken || null

  useAppStore.getState().setSession({ user, accessToken })
  clearAuthSession() // wipe any legacy localStorage token/user keys

  return { user, accessToken }
}

let refreshPromise = null

/** True when refresh failed because the server rejected the session (not a network blip). */
export function isFatalAuthRefreshError(error) {
  const status = error?.status
  if (status === 401 || status === 403) return true
  const code = String(error?.code || '')
  return (
    code === 'SESSION_EXPIRED' ||
    code === 'REFRESH_TOKEN_MISSING' ||
    code === 'REFRESH_TOKEN_INVALID'
  )
}

/** GET /api/auth/me — used to hydrate user after cookie refresh when payload has no user. */
export async function fetchCurrentUser() {
  const payload = await http.get(API_ENDPOINTS.auth.me, { skipAuthRefresh: true })
  return mapAuthUser(payload?.user)
}

/**
 * Exchange the HttpOnly refresh cookie for a new in-memory access token.
 * POST /api/auth/refresh
 * Session cookie is valid for at least 7 days (backend TTL).
 */
export async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = http
      .post(
        API_ENDPOINTS.auth.refresh,
        { portal: AUTH_PORTAL },
        { skipAuthRefresh: true }
      )
      .then(async (payload) => {
        let result = applyLoginPayload(payload)
        if (!result.accessToken) {
          throw new Error('Refresh did not return an access token')
        }
        if (!result.user) {
          const user = await fetchCurrentUser()
          if (user) {
            result = applyLoginPayload({
              user,
              accessToken: result.accessToken,
            })
          }
        }
        return result
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

/** GET /api/auth/security-questions */
export async function getSecurityQuestions() {
  const payload = await http.get(API_ENDPOINTS.auth.securityQuestions)
  return Array.isArray(payload?.questions) ? payload.questions : []
}

/**
 * POST /api/auth/register
 * Returns OTP challenge — user is not logged in yet.
 */
export async function register(data) {
  const payload = await http.post(API_ENDPOINTS.auth.register, {
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: data.password,
    confirmPassword: data.confirmPassword,
    securityAnswers: data.securityAnswers,
  })

  return {
    requiresOTPVerification: Boolean(payload?.requiresOTPVerification),
    message: payload?.message || 'OTP sent to your email.',
    email: payload?.email || data.email,
    identifier: payload?.identifier || payload?.email || data.email,
    identifierType: payload?.identifierType || 'email',
    deliveredVia: payload?.deliveredVia || ['email'],
  }
}

/**
 * POST /api/auth/otp-verify-login
 * Completes registration and logs the user in.
 */
export async function verifyRegistrationOtp({ identifier, otp, email }) {
  const payload = await http.post(API_ENDPOINTS.auth.otpVerifyLogin, {
    identifier: identifier || email,
    email: email || undefined,
    otp: String(otp || '').trim(),
  })

  const session = applyLoginPayload(payload)
  try {
    await syncBagsAfterLogin()
  } catch {
    // Session is valid even if bag sync fails; UI can refetch later.
  }
  return {
    message: payload?.message || 'Email verified successfully.',
    ...session,
  }
}

/**
 * POST /api/auth/login
 * Always sends portal: "ecomm" for the storefront.
 */
export async function login({ identifier, email, password }) {
  const payload = await http.post(API_ENDPOINTS.auth.login, {
    identifier: identifier || email,
    password,
    portal: AUTH_PORTAL,
  })

  const session = applyLoginPayload(payload)
  try {
    await syncBagsAfterLogin()
  } catch {
    // Session is valid even if bag sync fails; UI can refetch later.
  }
  return {
    message: payload?.message || 'Login successful',
    ...session,
  }
}

/**
 * POST /api/auth/google
 * Body: { idToken } — JWT from Google Identity Services callback.
 */
export async function googleLogin({ idToken }) {
  const payload = await http.post(API_ENDPOINTS.auth.google, {
    idToken: String(idToken || '').trim(),
  })

  const session = applyLoginPayload(payload)
  try {
    await syncBagsAfterLogin()
  } catch {
    // Session is valid even if bag sync fails; UI can refetch later.
  }
  return {
    message: payload?.message || 'Logged in with Google',
    ...session,
  }
}

export async function logout() {
  try {
    await http.post(
      API_ENDPOINTS.auth.logout,
      { portal: AUTH_PORTAL },
      { skipAuthRefresh: true }
    )
  } catch {
    // Clear local session even if the network call fails
  } finally {
    useAppStore.getState().clearUser()
    try {
      useAppStore.persist?.clearStorage()
    } catch {
      /* ignore */
    }
  }
}

/** POST /api/auth/forgot-password/find-user */
export async function forgotPasswordFindUser({ identifier, email, phone }) {
  const payload = await http.post(API_ENDPOINTS.auth.forgotFindUser, {
    identifier: identifier || email || phone,
    email: email || undefined,
    phone: phone || undefined,
  })

  return {
    message: payload?.message,
    challengeToken: payload?.challengeToken,
    question: payload?.question || payload?.questions?.[0] || null,
    questions: Array.isArray(payload?.questions) ? payload.questions : [],
    identifierKind: payload?.identifierKind || 'email',
    maxAttempts: payload?.maxAttempts ?? 3,
  }
}

/** POST /api/auth/forgot-password/verify-answers */
export async function forgotPasswordVerifyAnswers({ challengeToken, answers }) {
  const payload = await http.post(API_ENDPOINTS.auth.forgotVerifyAnswers, {
    challengeToken,
    answers,
  })

  return {
    message: payload?.message,
    resetToken: payload?.resetToken || null,
    requiresOtpFallback: Boolean(payload?.requiresOtpFallback),
    otpSent: Boolean(payload?.otpSent),
    challengeToken: payload?.challengeToken || challengeToken,
    emailHint: payload?.emailHint || null,
    phone: payload?.phone || null,
    identifier: payload?.identifier || null,
    attemptsRemaining: payload?.attemptsRemaining,
    attemptsUsed: payload?.attemptsUsed,
  }
}

/** POST /api/auth/forgot-password/verify-otp-fallback */
export async function forgotPasswordVerifyOtpFallback({ challengeToken, otp }) {
  const payload = await http.post(API_ENDPOINTS.auth.forgotVerifyOtpFallback, {
    challengeToken,
    otp: String(otp || '').trim(),
  })

  return {
    message: payload?.message,
    resetToken: payload?.resetToken,
    phone: payload?.phone || null,
    identifier: payload?.identifier || null,
  }
}

/** POST /api/auth/forgot-password/reset-direct */
export async function forgotPasswordResetDirect({ resetToken, newPassword, confirmPassword }) {
  const payload = await http.post(API_ENDPOINTS.auth.forgotResetDirect, {
    resetToken,
    newPassword,
    confirmPassword,
  })

  return {
    message: payload?.message || 'Password reset successful.',
    phone: payload?.phone || null,
  }
}
