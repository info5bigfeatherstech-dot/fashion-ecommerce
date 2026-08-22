import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { SITE_NAME } from '@/config/site'

let razorpayScriptLoadPromise = null
let activeRazorpayInstance = null
let lastRazorpayClosedAt = 0
let razorpaySessionGeneration = 0
let razorpayPreparedGeneration = -1
let razorpayDismissFinalizedGeneration = -1

const RAZORPAY_DOM_WAIT_MAX_FRAMES = 45
const RAZORPAY_THEME_COLOR = '#E0396A'

const countRazorpayDom = () => {
  if (typeof document === 'undefined') return {}
  return {
    containers: document.querySelectorAll('.razorpay-container').length,
    backdrops: document.querySelectorAll('.razorpay-backdrop').length,
    iframes: document.querySelectorAll('iframe[src*="razorpay.com"]').length,
    spinners: document.querySelectorAll('.razorpay-body-spinner').length,
  }
}

const removeRazorpayDomArtifacts = () => {
  if (typeof document === 'undefined') return

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
    .forEach((node) => node.remove())

  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
}

const hasRazorpayDomArtifacts = () => {
  const dom = countRazorpayDom()
  return (
    (dom.containers || 0)
      + (dom.backdrops || 0)
      + (dom.iframes || 0)
      + (dom.spinners || 0)
    > 0
  )
}

const waitForRazorpayDomGone = (maxFrames = RAZORPAY_DOM_WAIT_MAX_FRAMES) =>
  new Promise((resolve) => {
    let frames = 0
    const tick = () => {
      const stillPresent = hasRazorpayDomArtifacts()
      if (!stillPresent || frames >= maxFrames) {
        resolve({ frames, forced: stillPresent && frames >= maxFrames })
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
  })

export const markRazorpaySessionClosed = () => {
  activeRazorpayInstance = null
  lastRazorpayClosedAt = Date.now()
  razorpaySessionGeneration += 1
}

export const finalizeRazorpayDismiss = async () => {
  await waitForRazorpayDomGone()
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
}, ref) => {
  const razorpayInitialized = useRef(false)
  const razorpayInstance = useRef(null)
  const paymentStateRef = useRef(paymentState || 'idle')
  const onRecoveryStartRef = useRef(onRecoveryStart)

  useEffect(() => {
    paymentStateRef.current = paymentState
  }, [paymentState])

  useEffect(() => {
    onRecoveryStartRef.current = onRecoveryStart
  }, [onRecoveryStart])

  useImperativeHandle(ref, () => ({
    closeModal: () => {
      if (razorpayInstance.current) {
        try { razorpayInstance.current.close() } catch { /* ignore */ }
      }
    },
  }))

  useEffect(() => {
    const initPayment = async () => {
      if (razorpayInitialized.current) return

      if (!razorpayOrder?.id) {
        onPaymentStateChange?.('failed')
        onFailure?.('Invalid payment order. Please try again.')
        return
      }
      if (!razorpayKey) {
        onPaymentStateChange?.('failed')
        onFailure?.('Payment gateway not configured. Please try again later.')
        return
      }

      razorpayInitialized.current = true

      if (razorpayPreparedGeneration !== razorpaySessionGeneration) {
        await prepareRazorpayCheckoutSession()
      }

      const isScriptLoaded = await ensureRazorpayScript()
      if (!isScriptLoaded) {
        onPaymentStateChange?.('failed')
        onFailure?.('Failed to load payment gateway. Check your internet connection.')
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
          onPaymentStateChange?.('success')
          try { razorpayInstance.current?.close() } catch { /* ignore */ }
          razorpayInstance.current = null
          markRazorpaySessionClosed()
          onSuccess?.(response)
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

            if (currentState === 'success' || currentState === 'failed') {
              return
            }

            if (currentState === 'initiated') {
              onRecoveryStartRef.current?.()
              paymentStateRef.current = 'cancelled'
              onPaymentStateChange?.('cancelled')
              razorpayInstance.current = null
              markRazorpaySessionClosed()
              void finalizeRazorpayDismiss().then(() => onClose?.())
              return
            }

            onRecoveryStartRef.current?.()
            onPaymentStateChange?.('cancelled')
            razorpayInstance.current = null
            markRazorpaySessionClosed()
            void finalizeRazorpayDismiss().then(() => onClose?.())
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
          onPaymentStateChange?.('failed')
          const errorMessage =
            response.error?.description
            || response.error?.reason
            || 'Payment failed. Please try again.'
          try { razorpayInstance.current?.close() } catch { /* ignore */ }
          razorpayInstance.current = null
          markRazorpaySessionClosed()
          onFailure?.(errorMessage)
        })

        paymentStateRef.current = 'initiated'
        onPaymentStateChange?.('initiated')
        razorpayInstance.current.open()
      } catch {
        paymentStateRef.current = 'failed'
        onPaymentStateChange?.('failed')
        onFailure?.('Failed to initialize payment. Please try again.')
      }
    }

    initPayment()

    return () => {
      razorpayInitialized.current = false
      razorpayInstance.current = null
    }
  }, [razorpayOrder?.id, razorpayKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
})

RazorpayCheckout.displayName = 'RazorpayCheckout'

export default RazorpayCheckout
