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

/**
 * Post–Google Sign-In step: collect phone to finish the storefront account.
 */
export function PhoneRequiredGate() {
  const authReady = useAppStore((s) => s.authReady)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const user = useAppStore((s) => s.user)
  const accessToken = useAppStore((s) => s.accessToken)
  const closeAuthModal = useAppStore((s) => s.closeAuthModal)

  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const needsPhone =
    Boolean(authReady) &&
    Boolean(isAuthenticated) &&
    Boolean(accessToken) &&
    userNeedsContactPhone(user)

  const signedInAs = useMemo(
    () => String(user?.email || user?.name || '').trim() || 'your account',
    [user?.email, user?.name]
  )

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
      await logout()
    } catch {
      // cleared in logout finally
    } finally {
      setLoggingOut(false)
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
          <p className="gphone__email" title={signedInAs}>
            {signedInAs}
          </p>
        </header>

        <p className="gphone__prompt">
          Used for order updates and delivery support.
        </p>

        <div className={`gphone__field${error ? ' is-error' : ''}`}>
          <label htmlFor="gphone-input" className="gphone__label">
            Phone number
          </label>
          <div className="gphone__input-shell">
            <span className="gphone__cc" aria-hidden="true">
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
