import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { BrandLogo } from '@/components/layout/BrandLogo'
import brandMark from '@/assets/FabUniqo-logo-transparent.png'
import { SITE_NAME } from '@/config/site'
import { useAppStore } from '@/store'
import {
  logout,
  updateProfile,
  userNeedsContactPhone,
  refreshCurrentUser,
} from '@/features/auth/api'

function normalizePhoneInput(value) {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, 10)
}

/** Google's material palette used for Gmail letter avatars */
const GOOGLE_AVATAR_PALETTE = [
  '#1a73e8', // Google Blue
  '#d93025', // Google Red
  '#1e8e3e', // Google Green
  '#e8710a', // Google Orange
  '#8430ce', // Google Purple
  '#007b83', // Google Teal
  '#f29900', // Google Amber
  '#d01884', // Google Pink
  '#185abc', // Google Navy
  '#a142f4', // Google Violet
  '#0d652d', // Google Forest
  '#b31412', // Google Deep Red
]

function getGoogleAvatarColor(identifier = '') {
  const str = String(identifier || '').trim().toLowerCase()
  if (!str) return '#1a73e8'
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0
  }
  return GOOGLE_AVATAR_PALETTE[Math.abs(hash) % GOOGLE_AVATAR_PALETTE.length]
}

/**
 * Post–Google Sign-In step: collect phone to finish the storefront account.
 */
export function PhoneRequiredGate() {
  const authReady = useAppStore((s) => s.authReady)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const user = useAppStore((s) => s.user)
  const accessToken = useAppStore((s) => s.accessToken)
  const openAuthModal = useAppStore((s) => s.openAuthModal)
  const closeAuthModal = useAppStore((s) => s.closeAuthModal)

  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  const needsPhone =
    Boolean(authReady) &&
    Boolean(isAuthenticated) &&
    Boolean(accessToken) &&
    userNeedsContactPhone(user)

  const signedInAs = useMemo(
    () => String(user?.email || user?.name || '').trim() || 'your account',
    [user?.email, user?.name]
  )

  const avatarUrl = useMemo(() => {
    if (imgFailed) return null
    const direct = user?.picture || user?.avatar || user?.photo || user?.image
    if (direct) return direct
    try {
      return sessionStorage.getItem('google_profile_picture') || null
    } catch {
      return null
    }
  }, [user?.picture, user?.avatar, user?.photo, user?.image, imgFailed])

  const avatarColor = useMemo(
    () => getGoogleAvatarColor(user?.email || signedInAs),
    [user?.email, signedInAs]
  )

  const avatarInitial = useMemo(() => {
    const raw = String(user?.name || user?.email || signedInAs).trim()
    return raw ? raw.charAt(0).toUpperCase() : '?'
  }, [user?.name, user?.email, signedInAs])

  useEffect(() => {
    setImgFailed(false)
  }, [user?.id, user?.email])

  useEffect(() => {
    if (!authReady || !isAuthenticated || !accessToken) return undefined
    if (!userNeedsContactPhone(user)) return undefined

    refreshCurrentUser().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isAuthenticated, accessToken, user?.id])

  useEffect(() => {
    if (needsPhone) {
      closeAuthModal()
      setPhone('')
      setError('')
    }
  }, [needsPhone, closeAuthModal])

  if (!needsPhone) return null

  const canSubmit = phone.length === 10 && !saving && !loggingOut

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const normalized = normalizePhoneInput(phone)
    if (!/^[0-9]{10}$/.test(normalized)) {
      setError('Enter a valid 10-digit phone number')
      return
    }

    setSaving(true)
    try {
      await updateProfile({ phone: normalized })
      setPhone('')
      setError('')
    } catch (err) {
      setError(
        err?.message ||
          err?.response?.data?.message ||
          'Could not save phone number. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    setError('')
    try {
      try {
        sessionStorage.removeItem('google_profile_picture')
        window.google?.accounts?.id?.disableAutoSelect?.()
      } catch {
        // ignore
      }
      await logout()
    } catch {
      // cleared in logout finally
    } finally {
      setLoggingOut(false)
      openAuthModal({ mode: 'login' })
    }
  }

  return (
    <Modal
      open
      onOpenChange={() => {}}
      dismissible={false}
      hideClose
      className="modal-content--google-phone"
      overlayClassName="modal-overlay--black"
    >
      <form className="gphone" onSubmit={handleSubmit} noValidate>
        <header className="gphone__intro">
          <div className="gphone__brand">
            <BrandLogo
              src={brandMark}
              className="gphone__logo brand-logo--gate"
            />
          </div>
          <h2 className="gphone__title">Add your mobile number</h2>
          <p className="gphone__subtitle">
            One step left to finish signing in to {SITE_NAME}.
          </p>
          <div className="gphone__account-pill" title={signedInAs}>
            <span
              className="gphone__account-avatar"
              style={avatarUrl ? undefined : { backgroundColor: avatarColor, color: '#ffffff' }}
              aria-hidden="true"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="gphone__account-avatar-img"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                avatarInitial
              )}
            </span>
            <span className="gphone__email">
              {signedInAs}
            </span>
          </div>
        </header>

        <div className="gphone__body">
          <p className="gphone__prompt">
            Used for order updates and delivery support.
          </p>

          <div className={`gphone__field${error ? ' is-error' : ''}`}>
            <label htmlFor="gphone-input" className="gphone__label">
              Phone number
            </label>
            <div className="gphone__input-shell">
              <span className="gphone__cc" aria-hidden="true">
                <span className="gphone__flag" aria-hidden="true">🇮🇳</span>
                +91
              </span>
              <input
                id="gphone-input"
                className="gphone__input"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                placeholder="Phone number"
                aria-label="10-digit phone number"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'gphone-error' : 'gphone-help'}
                value={phone}
                disabled={saving || loggingOut}
                autoFocus
                onChange={(e) => {
                  setPhone(normalizePhoneInput(e.target.value))
                  if (error) setError('')
                }}
                onKeyDown={(e) => {
                  if (e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault()
                  }
                }}
              />
            </div>
            {error ? (
              <p id="gphone-error" className="gphone__error" role="alert">
                {error}
              </p>
            ) : (
              <p id="gphone-help" className="gphone__help">
                10-digit Indian mobile number
              </p>
            )}
          </div>
        </div>

        <div className="gphone__footer">
          <button
            type="button"
            className="gphone__link"
            disabled={saving || loggingOut}
            onClick={handleLogout}
          >
            {loggingOut ? 'Signing out…' : 'Use another account'}
          </button>
          <button
            type="submit"
            className="gphone__next"
            disabled={!canSubmit}
          >
            {saving ? 'Saving…' : 'Next'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
