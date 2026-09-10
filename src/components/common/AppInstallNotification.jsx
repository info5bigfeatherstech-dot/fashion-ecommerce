import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Sparkles, Smartphone, Share, PlusSquare, Zap, ShieldCheck, Tag } from 'lucide-react'
import { useAppStore } from '@/store'
import { stopLenis, startLenis } from '@/lib/lenis'
import '@/styles/app-install-notification.css'

const SESSION_DISMISS_KEY = 'fabuniqo_app_install_dismissed'
const SHOW_DELAY_MS = 5000 // 5 seconds

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

  // 5-second countdown timer for unauthenticated users
  useEffect(() => {
    // If user is already authenticated, do nothing
    if (isAuthenticated) {
      setIsOpen(false)
      return undefined
    }

    // If app is already running as installed PWA standalone, don't show
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      window.navigator?.standalone === true
    if (isStandalone) return undefined

    // Check if dismissed during current browser session
    try {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === 'true') {
        return undefined
      }
    } catch {
      // ignore
    }

    // Start 5-second timer
    const timer = setTimeout(() => {
      const currentState = useAppStore.getState()
      if (!currentState.isAuthenticated) {
        setIsOpen(true)
      }
    }, SHOW_DELAY_MS)

    return () => {
      clearTimeout(timer)
    }
  }, [isAuthenticated, authReady])

  // Dismiss / Cancel handler ("Maybe later")
  const handleDismiss = () => {
    setIsOpen(false)
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, 'true')
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
          handleDismiss()
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
        {isOpen && !isAuthenticated && (
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
                onClick={handleDismiss}
                aria-label="Close"
              >
                <X size={16} />
              </button>

              {/* VIP Badge */}
              <div className="flex justify-center mt-2">
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
                  onClick={handleDismiss}
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
                onClick={() => setShowGuideModal(false)}
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
                  handleDismiss()
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
