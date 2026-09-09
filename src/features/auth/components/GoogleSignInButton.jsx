import { useEffect, useRef, useState } from 'react'
import { googleLogin } from '@/features/auth/api'
import { GoogleIcon } from './GoogleIcon'

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || ''

let gsiScriptLoadPromise = null
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
    `Add it under Google Cloud → Credentials → Web client → Authorized JavaScript origins ` +
    `(not only Redirect URIs). Client: ${GOOGLE_CLIENT_ID || '(missing)'}.`
  )
}

/**
 * Stretching a cross-origin GSI iframe with CSS width/height does NOT enlarge its
 * internal hit-target — desktop clicks miss. Scale the iframe so the hit area covers
 * our custom button (works on mobile + desktop).
 */
function fitGsiIframeToMount(mountEl) {
  if (!mountEl) return
  const iframe = mountEl.querySelector('iframe')
  if (!iframe) return

  const mountW = mountEl.clientWidth || 1
  const mountH = mountEl.clientHeight || 1

  // Reset before measuring natural size
  iframe.style.position = 'absolute'
  iframe.style.left = '0'
  iframe.style.top = '0'
  iframe.style.transform = 'none'
  iframe.style.transformOrigin = '0 0'
  iframe.style.maxWidth = 'none'
  iframe.style.margin = '0'
  iframe.style.border = '0'
  iframe.style.opacity = '1'

  const natW = iframe.offsetWidth || Number.parseInt(iframe.getAttribute('width') || '0', 10) || mountW
  const natH = iframe.offsetHeight || Number.parseInt(iframe.getAttribute('height') || '0', 10) || 44

  const scale = Math.max(mountW / natW, mountH / natH)
  iframe.style.transform = `scale(${scale})`
  iframe.style.transformOrigin = '0 0'
}

export function isGoogleSignInConfigured() {
  return Boolean(GOOGLE_CLIENT_ID)
}

/**
 * Custom-styled Google button + real GSI control scaled over it.
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
  const resizeTimerRef = useRef(null)
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
    let ro = null

    const markBlocked = (message) => {
      if (cancelled) return
      readyRef.current = false
      setGsiReady(false)
      setUnavailable(true)
      setBlockReason(message)
      errorRef.current?.(message)
      if (import.meta.env.DEV) console.warn('[GoogleSignIn]', message)
    }

    const renderGsiButton = () => {
      if (cancelled || !mountRef.current || !window.google?.accounts?.id) return false

      const width = Math.max(
        200,
        Math.min(400, Math.floor(rootRef.current?.clientWidth || 320))
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

      // Fit after Google injects the iframe (often async)
      requestAnimationFrame(() => {
        if (cancelled) return
        fitGsiIframeToMount(mountRef.current)
        requestAnimationFrame(() => fitGsiIframeToMount(mountRef.current))
      })
      return true
    }

    const waitForGsiIframe = async (attempts = 25) => {
      for (let i = 0; i < attempts; i += 1) {
        if (cancelled) return false
        if (mountRef.current?.querySelector('iframe')) return true
        await new Promise((r) => setTimeout(r, 80))
      }
      return Boolean(mountRef.current?.querySelector('iframe, div[role="button"]'))
    }

    const scheduleRefit = () => {
      if (cancelled || !readyRef.current) return
      window.clearTimeout(resizeTimerRef.current)
      resizeTimerRef.current = window.setTimeout(() => {
        if (cancelled || !readyRef.current) return
        renderGsiButton()
        waitForGsiIframe(15).then((ok) => {
          if (ok && !cancelled) fitGsiIframeToMount(mountRef.current)
        })
      }, 150)
    }

    const init = async () => {
      // Modal layout can take a couple frames
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      if (cancelled || !mountRef.current) return

      const loaded = await loadGsiScript()
      if (cancelled) return

      if (!loaded || !window.google?.accounts?.id) {
        markBlocked('Google sign-in script failed to load. Check network / ad blockers.')
        return
      }

      try {
        if (gsiInitializedForClientId !== GOOGLE_CLIENT_ID) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
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
          markBlocked(originBlockedMessage())
          return
        }

        fitGsiIframeToMount(mountRef.current)
        readyRef.current = true
        setGsiReady(true)
        setUnavailable(false)
        setBlockReason('')
      } catch (err) {
        markBlocked(err?.message || originBlockedMessage())
      }
    }

    init()

    if (typeof ResizeObserver !== 'undefined' && rootRef.current) {
      ro = new ResizeObserver(scheduleRefit)
      ro.observe(rootRef.current)
    }
    window.addEventListener('resize', scheduleRefit)

    return () => {
      cancelled = true
      readyRef.current = false
      window.clearTimeout(resizeTimerRef.current)
      window.removeEventListener('resize', scheduleRefit)
      ro?.disconnect()
    }
  }, [])

  const isDisabled = disabled || busy

  const handleFallbackClick = () => {
    if (isDisabled) return
    errorRef.current?.(
      blockReason ||
        (GOOGLE_CLIENT_ID ? originBlockedMessage() : 'Google sign-in is not configured.')
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

export function AuthDivider({ label = 'OR' } = {}) {
  return (
    <div className="auth-divider" role="separator">
      <span className="auth-divider__line" aria-hidden="true" />
      <span className="auth-divider__label">{label}</span>
      <span className="auth-divider__line" aria-hidden="true" />
    </div>
  )
}
