import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Sparkles, Smartphone, Share, PlusSquare, Zap, ShieldCheck, Tag } from 'lucide-react'
import { useAppStore } from '@/store'
import { stopLenis, startLenis } from '@/lib/lenis'
import fabUniqoLogo from '@/assets/FabUniqo-logo-install.png'
import '@/styles/app-install-notification.css'

const INSTALL_COOLDOWN_KEY = 'fabuniqo_app_install_cooldown_until'
const INSTALL_AUTHED_COOLDOWN_KEY = 'fabuniqo_app_install_authed_cooldown_until'
const INSTALL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
const SHOW_DELAY_MS = 2500

// Helper to check if the app install prompt is currently on 7-day cooldown
const isInstallOnCooldown = () => {
  try {
    const cooldownUntil = localStorage.getItem(INSTALL_COOLDOWN_KEY)
    if (cooldownUntil && Date.now() < Number(cooldownUntil)) {
      return true
    }
    const authedCooldown = localStorage.getItem(INSTALL_AUTHED_COOLDOWN_KEY)
    if (authedCooldown && Date.now() < Number(authedCooldown)) {
      return true
    }
  } catch {
    // ignore
  }
  return false
}

export function AppInstallNotification() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const authReady = useAppStore((s) => s.authReady)

  const [isOpen, setIsOpen] = useState(false)
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)

  const deferredPromptRef = useRef(null)

  // Manage Lenis & body scroll locking whenever modal is open
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

  // Listen for native PWA beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      deferredPromptRef.current = e
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Detect iOS
    const ua = window.navigator?.userAgent || ''
    const isAppleMobile = /iPhone|iPad|iPod/i.test(ua)
    setIsIOS(isAppleMobile)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const timerRef = useRef(null)
  const dismissedThisSessionRef = useRef(false)
  const suppressUntilReloadRef = useRef(false)
  const prevAuthRef = useRef(null)

  const schedulePopup = (delay = SHOW_DELAY_MS) => {
    // If user just logged in in this session, do not show until they reload
    if (suppressUntilReloadRef.current) return

    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      window.navigator?.standalone === true
    if (isStandalone) return

    if (isInstallOnCooldown()) return
    if (dismissedThisSessionRef.current) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (suppressUntilReloadRef.current) return
      if (isInstallOnCooldown()) return
      if (dismissedThisSessionRef.current) return
      setIsOpen(true)
    }, delay)
  }

  // Show install popup:
  // - unauthenticated users: 2.5s delay
  // - authenticated users on page reload: 1.2s delay
  // - after login in this session: suppressed until page reload
  useEffect(() => {
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      window.navigator?.standalone === true
    if (isStandalone) return undefined

    // Clear any leftover notification allowed session flag so install popup shows
    try {
      sessionStorage.removeItem('fabuniqo_notification_allowed')
    } catch { /* ignore */ }

    if (!authReady) return undefined

    // Detect if user just logged in (transitioned from false to true without reloading)
    if (prevAuthRef.current === false && isAuthenticated === true) {
      suppressUntilReloadRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
      setIsOpen(false)
      prevAuthRef.current = isAuthenticated
      return undefined
    }
    prevAuthRef.current = isAuthenticated

    // If user logged in during this session, do not show until page reload
    if (suppressUntilReloadRef.current) return undefined

    if (isInstallOnCooldown()) {
      setIsOpen(false)
      return undefined
    }
    if (dismissedThisSessionRef.current) return undefined

    const delay = isAuthenticated ? 1200 : SHOW_DELAY_MS
    schedulePopup(delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isAuthenticated, authReady])

  // Real-time login event listener (dispatched by AuthModal on successful sign-in)
  useEffect(() => {
    const handleUserLogin = () => {
      // Per requirement: after login, install FabUniqo App popup should NOT come until reload!
      suppressUntilReloadRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
      setIsOpen(false)

      // Clear old cooldowns so user sees the install prompt when they reload
      try {
        localStorage.removeItem(INSTALL_COOLDOWN_KEY)
        localStorage.removeItem(INSTALL_AUTHED_COOLDOWN_KEY)
        sessionStorage.removeItem('fabuniqo_show_install_popup')
        sessionStorage.removeItem('fabuniqo_notification_allowed')
      } catch { /* ignore */ }
    }

    window.addEventListener('fabuniqo:user-login', handleUserLogin)
    return () => {
      window.removeEventListener('fabuniqo:user-login', handleUserLogin)
    }
  }, [])

  // When user is actively interacting with the notification allow popup,
  // cancel timers so the install modal does not overlap at that exact second.
  useEffect(() => {
    const handleNotificationAllowed = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setIsOpen(false)
    }

    window.addEventListener('fabuniqo:notification-allow-clicked', handleNotificationAllowed)
    window.addEventListener('fabuniqo:notification-allowed', handleNotificationAllowed)
    return () => {
      window.removeEventListener('fabuniqo:notification-allow-clicked', handleNotificationAllowed)
      window.removeEventListener('fabuniqo:notification-allowed', handleNotificationAllowed)
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

      // If user logged in during this session, do not show until page reload
      if (suppressUntilReloadRef.current) return

      // Reset the session-dismiss flag so popup can show again on tab return
      dismissedThisSessionRef.current = false

      if (isInstallOnCooldown()) return

      // Show popup when user returns from a different tab
      schedulePopup(600)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleTabHide()
      } else if (document.visibilityState === 'visible') {
        handleTabReturn()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleTabHide)
    window.addEventListener('focus', handleTabReturn)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleTabHide)
      window.removeEventListener('focus', handleTabReturn)
    }
  }, [])

  // Close handler: triggered when user clicks the [X] cross icon ->
  // closes popup, and will show again when the person reloads or goes to a different tab and comes back
  const handleClose = () => {
    dismissedThisSessionRef.current = true
    setIsOpen(false)
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  // Maybe Later handler: snoozes the install app popup for 7 days
  const handleMaybeLater = () => {
    setIsOpen(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    try {
      localStorage.setItem(INSTALL_COOLDOWN_KEY, String(Date.now() + INSTALL_COOLDOWN_MS))
      localStorage.removeItem(INSTALL_AUTHED_COOLDOWN_KEY)
    } catch {
      // ignore
    }
  }

  // Install button click handler
  const handleInstallClick = async () => {
    if (deferredPromptRef.current) {
      try {
        await deferredPromptRef.current.prompt()
        const choice = await deferredPromptRef.current.userChoice
        if (choice.outcome === 'accepted') {
          handleMaybeLater()
        }
      } catch (err) {
        console.error('Install prompt error:', err)
        setShowGuideModal(true)
      }
      deferredPromptRef.current = null
      setDeferredPrompt(null)
    } else {
      setShowGuideModal(true)
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div
            className="fab-app-center-overlay fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Install FabUniqo App"
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
              className="fab-app-center-card relative w-full max-w-md overflow-hidden text-center"
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

              {/* Brand Logo */}
              <div className="fab-app-logo-showcase">
                <img src={fabUniqoLogo} alt="FabUniqo - Fashion Uniquely Yours" />
              </div>

              {/* VIP Badge */}
              <div className="flex justify-center">
                <span className="fab-app-center-badge">
                  <Sparkles size={12} />
                  Official App
                </span>
              </div>

              {/* Main Title */}
              <h2 className="fab-app-center-title">
                Install FabUniqo App
              </h2>

              {/* Wishlist product price drop, sale notification per event */}
              {/* <div className="flex justify-center">
                <div className="fab-app-event-highlight">
                  <Tag size={13} className="shrink-0 text-[#d1a743]" />
                  <span>Wishlist product price drop, sale notification per event</span>
                </div>
              </div> */}

              {/* Description Text */}
              <p className="fab-app-center-desc">
                Shop Faster and Stay Updated with the Latest Styles, Offers and New Arrivals.
              </p>

              {/* Action Buttons */}
              <div className="fab-app-center-actions">
                <button
                  type="button"
                  className="fab-btn-center-install"
                  onClick={handleInstallClick}
                >
                  <Download size={17} />
                  Install App
                </button>

                <button
                  type="button"
                  className="fab-btn-center-maybe-later"
                  onClick={handleMaybeLater}
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fallback Install Instructions Modal for iOS / Desktop */}
      <AnimatePresence>
        {showGuideModal && (
          <div
            className="fab-install-guide-overlay fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setShowGuideModal(false)}
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
              className="fab-install-guide-modal relative w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <button
                type="button"
                className="fab-app-center-close"
                onClick={() => {
                  setShowGuideModal(false)
                  handleClose()
                }}
                aria-label="Close guide modal"
              >
                <X size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '42px', height: '42px', minWidth: '42px', borderRadius: '12px', background: '#F8F4EC', border: '1px solid #E8DECF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B38622' }}>
                  <Smartphone size={22} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 className="fab-install-guide-title" style={{ margin: 0 }}>Install FabUniqo App</h3>
                  <span style={{ fontSize: '0.78rem', color: '#8A651E', fontWeight: 600 }}>Quick 2-step setup</span>
                </div>
              </div>

              <p className="fab-install-guide-subtitle" style={{ textAlign: 'left' }}>
                {isIOS
                  ? 'Add FabUniqo to your Home Screen for a seamless full-screen mobile app experience:'
                  : 'Install FabUniqo directly to your device for instant 1-tap access:'}
              </p>

              <div className="fab-install-steps" style={{ textAlign: 'left' }}>
                {isIOS ? (
                  <>
                    <div className="fab-install-step-item">
                      <div className="fab-install-step-num">1</div>
                      <div className="fab-install-step-text">
                        Tap the <strong>Share button</strong> (<Share size={13} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} />) in Safari's bottom toolbar.
                      </div>
                    </div>
                    <div className="fab-install-step-item">
                      <div className="fab-install-step-num">2</div>
                      <div className="fab-install-step-text">
                        Scroll down and tap <strong>"Add to Home Screen"</strong> (<PlusSquare size={13} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} />).
                      </div>
                    </div>
                    <div className="fab-install-step-item">
                      <div className="fab-install-step-num">3</div>
                      <div className="fab-install-step-text">
                        Tap <strong>"Add"</strong> in the top-right corner to finish.
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="fab-install-step-item">
                      <div className="fab-install-step-num">1</div>
                      <div className="fab-install-step-text">
                        Tap your browser menu icon (<strong>⋮</strong> or <strong>Share</strong>).
                      </div>
                    </div>
                    <div className="fab-install-step-item">
                      <div className="fab-install-step-num">2</div>
                      <div className="fab-install-step-text">
                        Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                className="fab-install-guide-done"
                onClick={() => {
                  setShowGuideModal(false)
                  handleMaybeLater()
                }}
              >
                Got it, thanks!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
