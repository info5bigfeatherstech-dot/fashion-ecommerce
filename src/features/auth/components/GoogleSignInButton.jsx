import { useCallback, useEffect, useRef, useState } from 'react'
import { googleLogin } from '@/features/auth/api'
import { GoogleIcon } from './GoogleIcon'

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || ''

let gsiScriptLoadPromise = null

function loadGsiScript() {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.google?.accounts?.id) return Promise.resolve(true)
  if (gsiScriptLoadPromise) return gsiScriptLoadPromise

  gsiScriptLoadPromise = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.google?.accounts?.id)), { once: true })
      existing.addEventListener('error', () => resolve(false), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = GSI_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve(Boolean(window.google?.accounts?.id))
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  }).finally(() => {
    if (!window.google?.accounts?.id) {
      gsiScriptLoadPromise = null
    }
  })

  return gsiScriptLoadPromise
}

export function isGoogleSignInConfigured() {
  return Boolean(GOOGLE_CLIENT_ID)
}

/**
 * Custom-styled button that triggers hidden Google Identity Services button.
 * Matches fabFE flow: GSI idToken → POST /auth/google.
 */
export function GoogleSignInButton({
  label = 'Continue with Google',
  disabled = false,
  onSuccess,
  onError,
}) {
  const mountRef = useRef(null)
  const callbackRef = useRef(onSuccess)
  const errorRef = useRef(onError)
  const [gsiReady, setGsiReady] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    callbackRef.current = onSuccess
    errorRef.current = onError
  }, [onSuccess, onError])

  useEffect(() => {
    if (!mountRef.current || !GOOGLE_CLIENT_ID) return undefined

    let cancelled = false

    const init = async () => {
      const loaded = await loadGsiScript()
      if (cancelled || !loaded || !mountRef.current || !window.google?.accounts?.id) {
        return
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        use_fedcm_for_prompt: true,
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

      mountRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(mountRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        width: 320,
      })

      if (!cancelled) setGsiReady(true)
    }

    init()

    return () => {
      cancelled = true
    }
  }, [])

  const triggerGoogleClick = useCallback(() => {
    if (!mountRef.current || disabled || busy) return

    const googleButton = mountRef.current.querySelector('div[role="button"]')
    if (googleButton) {
      googleButton.click()
      return
    }

    const iframe = mountRef.current.querySelector('iframe')
    if (iframe) iframe.click()
  }, [busy, disabled])

  const isDisabled = disabled || busy || !gsiReady

  return (
    <div className="auth-google">
      <div ref={mountRef} className="auth-google__mount" aria-hidden="true" />
      <button
        type="button"
        className="auth-google-btn"
        onClick={triggerGoogleClick}
        disabled={isDisabled}
      >
        <GoogleIcon />
        <span>{busy ? 'Signing in…' : label}</span>
      </button>
    </div>
  )
}

/** Visual "OR" divider — matches fabFE placement below Google button. */
export function AuthDivider({ label = 'OR' }) {
  return (
    <div className="auth-divider" role="separator">
      <span className="auth-divider__line" aria-hidden="true" />
      <span className="auth-divider__label">{label}</span>
      <span className="auth-divider__line" aria-hidden="true" />
    </div>
  )
}
