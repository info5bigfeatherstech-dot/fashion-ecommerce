import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, Package, Sparkles, Tag, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/store'
import { stopLenis, startLenis } from '@/lib/lenis'
import '@/styles/app-install-notification.css'

const NOTIFY_STORAGE_KEY = 'fabuniqo_push_permission_prompted'
const NOTIFY_COOLDOWN_KEY = 'fabuniqo_notify_cooldown_until'
const NOTIFY_COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000 // 2 days in milliseconds
const INSTALL_COOLDOWN_KEY = 'fabuniqo_app_install_cooldown_until'
const INSTALL_AUTHED_COOLDOWN_KEY = 'fabuniqo_app_install_authed_cooldown_until'

// Helper to check if the notification prompt is currently on 2-day cooldown
const isNotifyOnCooldown = () => {
  try {
    const cooldownUntil = localStorage.getItem(NOTIFY_COOLDOWN_KEY)
    if (cooldownUntil && Date.now() < Number(cooldownUntil)) {
      return true
    }
  } catch {
    // ignore
  }
  return false
}

export function AllowNotificationModal() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const authReady = useAppStore((s) => s.authReady)

  const [isOpen, setIsOpen] = useState(false)
  const [grantedFeedback, setGrantedFeedback] = useState(false)

  // Manage Lenis & body scroll locking while modal is active
  useEffect(() => {
    if (isOpen) {
      stopLenis()
      document.documentElement.classList.add('modal-open')
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      startLenis()
      document.documentElement.classList.remove('modal-open')
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }

    return () => {
      startLenis()
      document.documentElement.classList.remove('modal-open')
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [isOpen])

  const timerRef = useRef(null)
  // Tracks if the user dismissed the popup via X in this session.
  // Resets on page reload (in-memory) or when they return from another tab.
  const dismissedThisSessionRef = useRef(false)

  const scheduleNotifyPopup = (delay = 8000) => {
    if (isNotifyOnCooldown()) return
    if (dismissedThisSessionRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (isNotifyOnCooldown()) return
      if (dismissedThisSessionRef.current) return

      // If the install app popup is currently active on screen, wait a bit longer
      const isInstallModalOpen = document.querySelector('[aria-label="Install FabUniqo App"]')
      if (isInstallModalOpen) {
        scheduleNotifyPopup(4000)
        return
      }

      const currentState = useAppStore.getState()
      if (
        currentState.isAuthenticated &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission !== 'granted'
      ) {
        setIsOpen(true)
      }
    }, delay)
  }

  const prevAuthRef = useRef(null)

  // Trigger on load / refresh when user is authenticated
  useEffect(() => {
    // Only prompt authenticated users
    if (!isAuthenticated || !authReady) {
      setIsOpen(false)
      if (timerRef.current) clearTimeout(timerRef.current)
      prevAuthRef.current = isAuthenticated
      return undefined
    }

    const justLoggedIn = prevAuthRef.current === false && isAuthenticated === true
    prevAuthRef.current = isAuthenticated

    // If currently on 2-day cooldown after "Maybe Later", do not show
    if (isNotifyOnCooldown()) {
      setIsOpen(false)
      return undefined
    }

    // Check browser notification support
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return undefined
    }

    // If permission already granted, skip
    if (Notification.permission === 'granted') {
      return undefined
    }

    if (dismissedThisSessionRef.current) return undefined

    // If user just logged in, show Allow Notifications promptly (1000ms).
    // On normal reload / visit while already logged in, show after 3500ms.
    const delay = justLoggedIn ? 1000 : 3500
    scheduleNotifyPopup(delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isAuthenticated, authReady])

  // Real-time login event listener (dispatched by AuthModal on sign-in)
  useEffect(() => {
    const handleUserLogin = () => {
      if (typeof window === 'undefined' || !('Notification' in window)) return
      if (Notification.permission === 'granted') return

      try {
        localStorage.removeItem(NOTIFY_COOLDOWN_KEY)
        sessionStorage.removeItem('fabuniqo_show_notify_popup')
        sessionStorage.removeItem('fabuniqo_notification_allowed')
      } catch { /* ignore */ }

      dismissedThisSessionRef.current = false
      setIsOpen(false)
      // Show promptly 1s after login
      scheduleNotifyPopup(1000)
    }

    window.addEventListener('fabuniqo:user-login', handleUserLogin)
    return () => {
      window.removeEventListener('fabuniqo:user-login', handleUserLogin)
    }
  }, [])

  // Re-trigger when user switches to a different tab and comes back
  const hasLeftTabRef = useRef(false)

  useEffect(() => {
    const handleTabHide = () => {
      hasLeftTabRef.current = true
    }

    const handleTabReturn = () => {
      if (!hasLeftTabRef.current) return
      hasLeftTabRef.current = false

      // Reset the session-dismiss flag so the popup can show again on tab return
      dismissedThisSessionRef.current = false

      if (isNotifyOnCooldown()) return
      const currentState = useAppStore.getState()
      if (
        currentState.isAuthenticated &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission !== 'granted'
      ) {
        // Show popup when user returns from a different tab
        scheduleNotifyPopup(600)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleTabHide()
      } else if (document.visibilityState === 'visible') {
        handleTabReturn()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Close handler: triggered when user clicks the [X] cross icon.
  // Sets a session flag so it won't auto-show again this session.
  // Resets on page reload or when user returns from another tab.
  const handleClose = () => {
    dismissedThisSessionRef.current = true
    setIsOpen(false)
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  // Maybe Later handler: snoozes the notification popup for 2 days
  const handleMaybeLater = () => {
    setIsOpen(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    try {
      localStorage.setItem(NOTIFY_COOLDOWN_KEY, String(Date.now() + NOTIFY_COOLDOWN_MS))
    } catch {
      // ignore
    }
  }

  // "Allow Notifications" — request permission + save Web Push subscription
  const handleAllowClick = async () => {
    try {
      // Clear any install cooldown and remove suppression so Install App popup can show on reload or tab switch
      try {
        localStorage.removeItem(INSTALL_COOLDOWN_KEY)
        localStorage.removeItem(INSTALL_AUTHED_COOLDOWN_KEY)
        sessionStorage.removeItem('fabuniqo_notification_allowed')
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent('fabuniqo:notification-allow-clicked'))

      if (!('Notification' in window)) {
        handleMaybeLater()
        return
      }
      const { subscribeToWebPush } = await import('@/utils/pushNotifications')
      await subscribeToWebPush()
      try {
        localStorage.setItem(NOTIFY_STORAGE_KEY, 'true')
        sessionStorage.removeItem('fabuniqo_notification_allowed')
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent('fabuniqo:notification-allowed'))
      setGrantedFeedback(true)
      setTimeout(() => {
        setIsOpen(false)
        setGrantedFeedback(false)
      }, 1500)
    } catch (err) {
      console.error('Notification subscribe error:', err)
      // Permission denied or SW/VAPID issue — snooze soft prompt
      handleMaybeLater()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && isAuthenticated && (
        <div
          className="fab-app-center-overlay fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Allow Notifications"
          onWheel={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onTouchMove={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <motion.div
            className="fab-app-center-card relative w-full max-w-md overflow-hidden text-center bg-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{
              duration: 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fab-app-center-glow" />

            {/* Close Button */}
            <button
              type="button"
              className="fab-app-center-close"
              onClick={handleClose}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Bell Icon Badge with Warm Pulse */}
            <div className="fab-notify-bell-container mt-2">
              <div className="fab-notify-bell-badge">
                <Bell size={26} />
                <div className="fab-notify-bell-pulse" />
              </div>
            </div>

            {/* VIP Badge */}
            <div className="flex justify-center">
              <span className="fab-app-center-badge">
                <Sparkles size={12} />
                Personalized VIP Alerts
              </span>
            </div>

            {/* Main Title */}
            <h2 className="fab-app-center-title">
              {grantedFeedback ? 'Notifications Enabled!' : 'Allow Notifications'}
            </h2>

            {/* Description Text with Montreal / Montserrat */}
            <p className="fab-app-center-desc">
              {grantedFeedback
                ? 'Thank you! You will now Receive Instant Updates on your Orders and Exclusive Drops.'
                : 'Stay Ahead of the Sparkle. Receive Personalized Updates Directly to your Device.'}
            </p>

            {/* Benefits List */}
            {/* {!grantedFeedback && (
              <div className="fab-notify-benefits-list">
                <div className="fab-notify-benefit-row">
                  <div className="fab-notify-benefit-icon-box">
                    <Package size={17} />
                  </div>
                  <div className="fab-notify-benefit-content">
                    <div className="fab-notify-benefit-heading">Real-Time Order Tracking</div>
                    <div className="fab-notify-benefit-subtext">Instant alerts when your package is dispatched & out for delivery.</div>
                  </div>
                </div>

                <div className="fab-notify-benefit-row">
                  <div className="fab-notify-benefit-icon-box">
                    <Tag size={17} />
                  </div>
                  <div className="fab-notify-benefit-content">
                    <div className="fab-notify-benefit-heading">Wishlist & Price Drop Alerts</div>
                    <div className="fab-notify-benefit-subtext">Know immediately when your favorite jewelry items go on sale.</div>
                  </div>
                </div>

                <div className="fab-notify-benefit-row">
                  <div className="fab-notify-benefit-icon-box">
                    <Sparkles size={17} />
                  </div>
                  <div className="fab-notify-benefit-content">
                    <div className="fab-notify-benefit-heading">VIP Drops & Secret Offers</div>
                    <div className="fab-notify-benefit-subtext">Exclusive early bird access before high-demand collections sell out.</div>
                  </div>
                </div>
              </div>
            )} */}

            {/* Action Buttons */}
            <div className="fab-app-center-actions">
              {grantedFeedback ? (
                <button
                  type="button"
                  className="fab-btn-center-install"
                  style={{ gap: '8px' }}
                  onClick={handleClose}
                >
                  <CheckCircle2 size={18} />
                  All Set!
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="fab-btn-center-install"
                    onClick={handleAllowClick}
                  >
                    <Bell size={17} />
                    Allow Notifications
                  </button>

                  <button
                    type="button"
                    className="fab-btn-center-maybe-later"
                    onClick={handleMaybeLater}
                  >
                    Maybe Later
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
