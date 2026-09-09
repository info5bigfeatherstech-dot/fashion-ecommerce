import { useEffect, useRef, useState } from 'react'
import { googleLogin } from '@/features/auth/api'
import { GoogleIcon } from './GoogleIcon'

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || ''

let gsiScriptLoadPromise = null
/** GSI initialize() must only run once per page load for a given client. */
let gsiInitializedForClientId = null

function loadGsiScript() {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.google?.accounts?.id) return Promise.resolve(true)
  if (gsiScriptLoadPromise) return gsiScriptLoadPromise

  gsiScriptLoadPromise = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`)
    if (existing) {
      if (existing.dataset.loaded === '1' || window.google?.accounts?.id) {
        resolve(Boolean(window.google?.accounts?.id))
        return
      }
      existing.addEventListener('load', () => resolve(Boolean(window.google?.accounts?.id)), { once: true })
      existing.addEventListener('error', () => resolve(false), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = GSI_SCRIPT_SRC
    script.async = true
    script.onload = () => {
      script.dataset.loaded = '1'
      resolve(Boolean(window.google?.accounts?.id))
    }
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  }).finally(() => {
    if (!window.google?.accounts?.id) {
      gsiScriptLoadPromise = null
    }
  })

  return gsiScriptLoadPromise
}

function originBlockedMessage() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '(unknown)'
  return (
    `Google blocked this page origin: ${origin}. ` +
    `In Google Cloud Console → Credentials → Web client → Authorized JavaScript origins, ` +
    `add exactly: ${origin} (and http://127.0.0.1:5173 if you use that). ` +
    `Client ID must be ${GOOGLE_CLIENT_ID || '(missing VITE_GOOGLE_CLIENT_ID)'}.`
  )
}

export function isGoogleSignInConfigured() {
  return Boolean(GOOGLE_CLIENT_ID)
}

/**
 * Custom-styled Google button with a real GSI control as a full-size invisible overlay.
 * Real user gesture hits Google's iframe (required in modern Chrome / production).
 * Flow: GSI idToken → POST /auth/google.
 */
export function GoogleSignInButton({
  label = 'Continue with Google',
  disabled = false,
  onSuccess,
  onError,
}) {
  const rootRef = useRef(null)
  const mountRef = useRef(null)
  const callbackRef = useRef(onSuccess)
  const errorRef = useRef(onError)
  const readyRef = useRef(false)
  const [gsiReady, setGsiReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [unavailable, setUnavailable] = useState(!GOOGLE_CLIENT_ID)
  const [blockReason, setBlockReason] = useState('')

  useEffect(() => {
    callbackRef.current = onSuccess
    errorRef.current = onError
  }, [onSuccess, onError])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setUnavailable(true)
      setBlockReason('Google sign-in is not configured (missing VITE_GOOGLE_CLIENT_ID).')
      return undefined
    }

    let cancelled = false

    const markBlocked = (message) => {
      if (cancelled) return
      readyRef.current = false
      setGsiReady(false)
      setUnavailable(true)
      setBlockReason(message)
      errorRef.current?.(message)
      if (import.meta.env.DEV) {
        console.warn('[GoogleSignIn]', message)
      }
    }

    const renderGsiButton = () => {
      if (cancelled || !mountRef.current || !window.google?.accounts?.id) return false

      const width = Math.max(
        240,
        Math.floor(rootRef.current?.clientWidth || mountRef.current.clientWidth || 320)
      )

      mountRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(mountRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width,
      })
      return true
    }

    const waitForGsiIframe = async (attempts = 20) => {
      for (let i = 0; i < attempts; i += 1) {
        if (cancelled) return false
        const iframe = mountRef.current?.querySelector('iframe')
        if (iframe) return true
        await new Promise((r) => setTimeout(r, 100))
      }
      return Boolean(mountRef.current?.querySelector('iframe, div[role="button"]'))
    }

    const init = async () => {
      await new Promise((resolve) => requestAnimationFrame(() => resolve()))
      if (cancelled || !mountRef.current) return

      const loaded = await loadGsiScript()
      if (cancelled) return

      if (!loaded || !mountRef.current || !window.google?.accounts?.id) {
        markBlocked('Google sign-in script failed to load. Check network / ad blockers.')
        return
      }

      try {
        // initialize once per client id (Strict Mode remounts are safe)
        if (gsiInitializedForClientId !== GOOGLE_CLIENT_ID) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            // Button overlay uses a real click; FedCM prompt is not required and can
            // surface confusing origin errors in some Chrome builds.
            use_fedcm_for_prompt: false,
            auto_select: false,
            cancel_on_tap_outside: true,
            callback: async (response) => {
              if (!response?.credential) {
                errorRef.current?.('Google did not return a sign-in token')
                return
              }

              setBusy(true)
              try {
                const result = await googleLogin({ idToken: response.credential })
                callbackRef.current?.(result)
              } catch (err) {
                errorRef.current?.(err?.message || 'Google sign-in failed')
              } finally {
                setBusy(false)
              }
            },
          })
          gsiInitializedForClientId = GOOGLE_CLIENT_ID
        }

        if (!renderGsiButton()) {
          markBlocked(originBlockedMessage())
          return
        }

        const iframeOk = await waitForGsiIframe()
        if (cancelled) return

        if (!iframeOk) {
          // Typical when Authorized JavaScript origins omit this exact origin
          markBlocked(originBlockedMessage())
          return
        }

        readyRef.current = true
        setGsiReady(true)
        setUnavailable(false)
        setBlockReason('')
      } catch (err) {
        markBlocked(err?.message || originBlockedMessage())
      }
    }

    init()

    const onResize = () => {
      if (cancelled || !readyRef.current) return
      renderGsiButton()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelled = true
      readyRef.current = false
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const isDisabled = disabled || busy

  const handleFallbackClick = () => {
    if (isDisabled) return
    errorRef.current?.(
      blockReason ||
        (GOOGLE_CLIENT_ID
          ? originBlockedMessage()
          : 'Google sign-in is not configured.')
    )
  }

  return (
    <div
      ref={rootRef}
      className={[
        'auth-google',
        isDisabled ? 'is-disabled' : '',
        busy ? 'is-busy' : '',
        gsiReady ? 'is-gsi-ready' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {gsiReady && !unavailable ? (
        <div className="auth-google-btn" aria-hidden="true">
          <GoogleIcon />
          <span>{busy ? 'Signing in…' : label}</span>
        </div>
      ) : (
        <button
          type="button"
          className="auth-google-btn"
          disabled={isDisabled}
          onClick={handleFallbackClick}
        >
          <GoogleIcon />
          <span>{busy ? 'Signing in…' : label}</span>
        </button>
      )}

      {!unavailable && <div ref={mountRef} className="auth-google__mount" />}
    </div>
  )
}

/** Visual "OR" divider — matches fabFE placement below Google button. */
export function AuthDivider({ label = 'OR' } = {}) {
  return (
    <div className="auth-divider" role="separator">
      <span className="auth-divider__line" aria-hidden="true" />
      <span className="auth-divider__label">{label}</span>
      <span className="auth-divider__line" aria-hidden="true" />
    </div>
  )
}
