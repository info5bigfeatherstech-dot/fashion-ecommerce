import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, Package, Sparkles, Tag, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/store'
import { stopLenis, startLenis } from '@/lib/lenis'
import '@/styles/app-install-notification.css'

const NOTIFY_STORAGE_KEY = 'fabuniqo_push_permission_prompted'
const PROMPT_DELAY_MS = 2000 // 2 seconds after user logs in

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

  // Trigger after user logs in
  useEffect(() => {
    // Only prompt authenticated users
    if (!isAuthenticated || !authReady) {
      setIsOpen(false)
      return undefined
    }

    // Check browser notification support
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return undefined
    }

    // If permission already granted or explicitly denied at browser level, skip
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return undefined
    }

    // Check if user already dismissed or interacted with this prompt before
    try {
      if (localStorage.getItem(NOTIFY_STORAGE_KEY) === 'true') {
        return undefined
      }
      if (sessionStorage.getItem(NOTIFY_STORAGE_KEY) === 'true') {
        return undefined
      }
    } catch {
      // ignore
    }

    // Wait 2 seconds after login before presenting the prompt
    const timer = setTimeout(() => {
      const currentState = useAppStore.getState()
      if (currentState.isAuthenticated) {
        setIsOpen(true)
      }
    }, PROMPT_DELAY_MS)

    return () => {
      clearTimeout(timer)
    }
  }, [isAuthenticated, authReady])

  // Dismiss ("Maybe Later") handler
  const handleDismiss = () => {
    setIsOpen(false)
    try {
      localStorage.setItem(NOTIFY_STORAGE_KEY, 'true')
      sessionStorage.setItem(NOTIFY_STORAGE_KEY, 'true')
    } catch {
      // ignore
    }
  }

  // "Allow Notifications" click handler
  const handleAllowClick = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          setGrantedFeedback(true)
          setTimeout(() => {
            handleDismiss()
            setGrantedFeedback(false)
          }, 1500)
          return
        }
      }
    } catch (err) {
      console.error('Notification request error:', err)
    }

    handleDismiss()
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
              onClick={handleDismiss}
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
                  onClick={handleDismiss}
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
                    onClick={handleDismiss}
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
