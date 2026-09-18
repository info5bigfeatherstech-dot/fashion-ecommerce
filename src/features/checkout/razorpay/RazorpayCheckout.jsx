import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { SITE_NAME } from '@/config/site'

let razorpayScriptLoadPromise = null
let activeRazorpayInstance = null
let lastRazorpayClosedAt = 0
let razorpaySessionGeneration = 0
let razorpayPreparedGeneration = -1
let razorpayDismissFinalizedGeneration = -1

const RAZORPAY_DOM_WAIT_MAX_FRAMES = 45
/** If success/fail UI is stuck with Razorpay DOM still open, force-clear after this. */
const RAZORPAY_STUCK_UI_TIMEOUT_MS = 10000
const RAZORPAY_THEME_COLOR = '#E0396A'

const countRazorpayDom = () => {
  if (typeof document === 'undefined') return {}
  try {
    return {
      containers: document.querySelectorAll('.razorpay-container').length,
      backdrops: document.querySelectorAll('.razorpay-backdrop').length,
      iframes: document.querySelectorAll('iframe[src*="razorpay.com"]').length,
      spinners: document.querySelectorAll('.razorpay-body-spinner').length,
    }
  } catch {
    return {}
  }
}

export const removeRazorpayDomArtifacts = () => {
  if (typeof document === 'undefined') return

  try {
    document
      .querySelectorAll(
        [
          '.razorpay-container',
          '.razorpay-backdrop',
          '.razorpay-body-spinner',
          'iframe[src*="razorpay.com"]',
          'iframe[name*="razorpay"]',
          'div[id*="razorpay"]',
        ].join(', ')
      )
      .forEach((node) => {
        try {
          node.remove()
        } catch {
          /* ignore */
        }
      })

    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  } catch {
    /* ignore */
  }
}

export const hasRazorpayDomArtifacts = () => {
  try {
    const dom = countRazorpayDom()
    return (
      (dom.containers || 0)
      + (dom.backdrops || 0)
      + (dom.iframes || 0)
      + (dom.spinners || 0)
      > 0
    )
  } catch {
    return false
  }
}

const waitForRazorpayDomGone = (maxFrames = RAZORPAY_DOM_WAIT_MAX_FRAMES) =>
  new Promise((resolve) => {
    let frames = 0
    const tick = () => {
      try {
        const stillPresent = hasRazorpayDomArtifacts()
        if (!stillPresent || frames >= maxFrames) {
          resolve({ frames, forced: stillPresent && frames >= maxFrames })
          return
        }
      } catch {
        resolve({ frames, forced: true })
        return
      }
      frames += 1
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

const hardResetRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(false)
      return
    }
    try {
      document
        .querySelectorAll('script[src*="checkout.razorpay.com"]')
        .forEach((node) => node.remove())
      razorpayScriptLoadPromise = null
      try {
        delete window.Razorpay
      } catch {
        window.Razorpay = undefined
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(Boolean(window.Razorpay))
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    } catch {
      resolve(false)
    }
  })

export const markRazorpaySessionClosed = () => {
  activeRazorpayInstance = null
  lastRazorpayClosedAt = Date.now()
  razorpaySessionGeneration += 1
}

/**
 * Close active instance + strip leftover Razorpay DOM.
 * Safe to call multiple times. Always prefer this before toast / navigation.
 */
export const forceCloseRazorpayUi = async () => {
  try {
    if (activeRazorpayInstance) {
      try {
        activeRazorpayInstance.close()
      } catch {
        /* ignore */
      }
      activeRazorpayInstance = null
    }
  } catch {
    /* ignore */
  }

  try {
    markRazorpaySessionClosed()
  } catch {
    /* ignore */
  }

  try {
    await waitForRazorpayDomGone(24)
  } catch {
    /* ignore */
  }

  try {
    removeRazorpayDomArtifacts()
  } catch {
    /* ignore */
  }

  razorpayDismissFinalizedGeneration = razorpaySessionGeneration
}

export const finalizeRazorpayDismiss = async () => {
  try {
    await waitForRazorpayDomGone()
  } catch {
    /* ignore */
  }
  removeRazorpayDomArtifacts()
  razorpayDismissFinalizedGeneration = razorpaySessionGeneration
}

export const prepareRazorpayCheckoutSession = async () => {
  if (typeof window === 'undefined') return

  const needsReset = lastRazorpayClosedAt > 0
  if (!needsReset) return

  if (razorpayDismissFinalizedGeneration !== razorpaySessionGeneration) {
    await waitForRazorpayDomGone()
    removeRazorpayDomArtifacts()
    razorpayDismissFinalizedGeneration = razorpaySessionGeneration
  }

  await hardResetRazorpayScript()
  razorpayPreparedGeneration = razorpaySessionGeneration
}

export const destroyRazorpayCheckoutSession = () => {
  if (activeRazorpayInstance) {
    try {
      activeRazorpayInstance.close()
    } catch {
      /* ignore */
    }
    activeRazorpayInstance = null
  }
  markRazorpaySessionClosed()
  try {
    removeRazorpayDomArtifacts()
  } catch {
    /* ignore */
  }
}

const ensureRazorpayScript = () => {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.Razorpay) return Promise.resolve(true)
  if (razorpayScriptLoadPromise) return razorpayScriptLoadPromise

  razorpayScriptLoadPromise = new Promise((resolve) => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true })
      existingScript.addEventListener('error', () => resolve(false), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  }).finally(() => {
    if (!window.Razorpay) {
      razorpayScriptLoadPromise = null
    }
  })

  return razorpayScriptLoadPromise
}

const RazorpayCheckout = forwardRef(({
  razorpayOrder,
  razorpayKey,
  orderId,
  userEmail,
  userName,
  userPhone,
  paymentState,
  onPaymentStateChange,
  onSuccess,
  onFailure,
  onClose,
  onRecoveryStart,
  onNaturalDismiss,
}, ref) => {
  const razorpayInitialized = useRef(false)
  const razorpayInstance = useRef(null)
  const paymentStateRef = useRef(paymentState || 'idle')
  const onRecoveryStartRef = useRef(onRecoveryStart)
  const onNaturalDismissRef = useRef(onNaturalDismiss)
  const onSuccessRef = useRef(onSuccess)
  const onFailureRef = useRef(onFailure)
  const onCloseRef = useRef(onClose)
  const onPaymentStateChangeRef = useRef(onPaymentStateChange)
  const naturalDismissHandledRef = useRef(false)
  const outcomeFlowStartedRef = useRef(false)

  useEffect(() => {
    paymentStateRef.current = paymentState
  }, [paymentState])

  useEffect(() => {
    onRecoveryStartRef.current = onRecoveryStart
  }, [onRecoveryStart])

  useEffect(() => {
    onNaturalDismissRef.current = onNaturalDismiss
  }, [onNaturalDismiss])

  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  useEffect(() => {
    onFailureRef.current = onFailure
  }, [onFailure])

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    onPaymentStateChangeRef.current = onPaymentStateChange
  }, [onPaymentStateChange])

  const emitNaturalDismiss = (reason) => {
    if (naturalDismissHandledRef.current) return
    naturalDismissHandledRef.current = true
    razorpayInstance.current = null
    activeRazorpayInstance = null
    try {
      markRazorpaySessionClosed()
    } catch {
      /* ignore */
    }
    try {
      removeRazorpayDomArtifacts()
    } catch {
      /* ignore */
    }
    try {
      onNaturalDismissRef.current?.(reason)
    } catch {
      /* ignore */
    }
  }

  /**
   * Guaranteed next-step: close Razorpay UI first, then run parent outcome handler.
   * Prevents toast/success while QR modal is still stuck on screen.
   */
  const runGuaranteedOutcome = (outcome, payload) => {
    if (outcomeFlowStartedRef.current) return
    outcomeFlowStartedRef.current = true

    void (async () => {
      try {
        await forceCloseRazorpayUi()
      } catch {
        try {
          removeRazorpayDomArtifacts()
        } catch {
          /* ignore */
        }
      }

      try {
        if (outcome === 'success') {
          await onSuccessRef.current?.(payload)
        } else if (outcome === 'failed') {
          onFailureRef.current?.(payload)
        }
      } catch {
        /* parent handles its own errors */
      } finally {
        emitNaturalDismiss(outcome)
      }
    })()
  }

  useImperativeHandle(ref, () => ({
    closeModal: () => {
      void forceCloseRazorpayUi()
    },
  }))

  // Safety net: if parent marked success/fail/verified but Razorpay DOM remains, force clear.
  useEffect(() => {
    const state = String(paymentState || '').toLowerCase()
    if (!['success', 'failed', 'verified', 'cancelled'].includes(state)) return undefined

    const timer = window.setTimeout(() => {
      try {
        if (hasRazorpayDomArtifacts()) {
          void forceCloseRazorpayUi().then(() => {
            emitNaturalDismiss(state === 'failed' || state === 'cancelled' ? state : 'success')
          })
        }
      } catch {
        /* ignore */
      }
    }, RAZORPAY_STUCK_UI_TIMEOUT_MS)

    return () => window.clearTimeout(timer)
  }, [paymentState]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const initPayment = async () => {
      if (razorpayInitialized.current) return

      if (!razorpayOrder?.id) {
        onPaymentStateChangeRef.current?.('failed')
        onFailureRef.current?.('Invalid payment order. Please try again.')
        return
      }
      if (!razorpayKey) {
        onPaymentStateChangeRef.current?.('failed')
        onFailureRef.current?.('Payment gateway not configured. Please try again later.')
        return
      }

      razorpayInitialized.current = true
      naturalDismissHandledRef.current = false
      outcomeFlowStartedRef.current = false

      if (razorpayPreparedGeneration !== razorpaySessionGeneration) {
        await prepareRazorpayCheckoutSession()
      }

      const isScriptLoaded = await ensureRazorpayScript()
      if (!isScriptLoaded) {
        onPaymentStateChangeRef.current?.('failed')
        onFailureRef.current?.('Failed to load payment gateway. Check your internet connection.')
        return
      }

      const customerName = userName || userEmail?.split('@')[0] || 'Customer'

      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: SITE_NAME,
        description: `Payment for Order ${orderId}`,
        order_id: razorpayOrder.id,
        handler: (response) => {
          paymentStateRef.current = 'success'
          onPaymentStateChangeRef.current?.('success')
          // Close modal first, then verify / navigate — never leave QR stuck behind toast.
          runGuaranteedOutcome('success', response)
        },
        prefill: {
          name: customerName,
          email: userEmail || '',
          contact: userPhone || '',
        },
        notes: { orderId },
        theme: { color: RAZORPAY_THEME_COLOR },
        modal: {
          ondismiss: () => {
            const currentState = paymentStateRef.current

            // Success/fail already running guaranteed outcome — only ensure DOM clear.
            if (currentState === 'success' || currentState === 'failed') {
              void forceCloseRazorpayUi().then(() => emitNaturalDismiss(currentState))
              return
            }

            if (outcomeFlowStartedRef.current) {
              void forceCloseRazorpayUi()
              return
            }

            onRecoveryStartRef.current?.()
            paymentStateRef.current = 'cancelled'
            onPaymentStateChangeRef.current?.('cancelled')
            razorpayInstance.current = null
            markRazorpaySessionClosed()
            void finalizeRazorpayDismiss().then(() => {
              try {
                onCloseRef.current?.()
              } catch {
                /* ignore */
              }
            })
          },
          escape: true,
          backdropclose: false,
        },
        retry: { enabled: true, retryCount: 2 },
      }

      try {
        razorpayInstance.current = new window.Razorpay(options)
        activeRazorpayInstance = razorpayInstance.current

        razorpayInstance.current.on('payment.failed', (response) => {
          paymentStateRef.current = 'failed'
          onPaymentStateChangeRef.current?.('failed')
          const errorMessage =
            response?.error?.description
            || response?.error?.reason
            || 'Payment failed. Please try again.'
          runGuaranteedOutcome('failed', errorMessage)
        })

        paymentStateRef.current = 'initiated'
        onPaymentStateChangeRef.current?.('initiated')
        razorpayInstance.current.open()
      } catch {
        paymentStateRef.current = 'failed'
        onPaymentStateChangeRef.current?.('failed')
        onFailureRef.current?.('Failed to initialize payment. Please try again.')
      }
    }

    initPayment()

    return () => {
      razorpayInitialized.current = false
      // On unmount after success/fail, strip any leftover overlay so it cannot stick.
      const state = paymentStateRef.current
      if (state === 'success' || state === 'failed' || state === 'verified' || state === 'cancelled') {
        try {
          removeRazorpayDomArtifacts()
        } catch {
          /* ignore */
        }
      }
      if (state !== 'success' && state !== 'failed') {
        razorpayInstance.current = null
      }
    }
  }, [razorpayOrder?.id, razorpayKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
})

RazorpayCheckout.displayName = 'RazorpayCheckout'

export default RazorpayCheckout
