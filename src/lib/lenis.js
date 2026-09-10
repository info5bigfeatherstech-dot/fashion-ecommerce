let lenisInstance = null
let suppressScrollRecording = false

export function setLenisInstance(instance) {
  lenisInstance = instance
}

export function getLenis() {
  return lenisInstance
}

export function stopLenis() {
  lenisInstance?.stop?.()
}

export function startLenis() {
  lenisInstance?.start?.()
}

/** True while a programmatic route scroll is applying — skip position recording. */
export function isScrollRecordingSuppressed() {
  return suppressScrollRecording
}

/** Jump to top immediately (works with or without Lenis). */
export function scrollToTop() {
  scrollToPosition(0)
}

/**
 * Jump to a specific scroll Y position synchronously.
 * Guarantees that the native scroller is immediately at the target Y.
 */
export function scrollToPosition(y = 0) {
  const targetY = Math.max(0, Number(y) || 0)

  try {
    window.scrollTo({ top: targetY, left: 0, behavior: 'instant' })
  } catch (_) {
    window.scrollTo(0, targetY)
  }

  if (document.documentElement) {
    document.documentElement.scrollTop = targetY
  }
  if (document.body) {
    document.body.scrollTop = targetY
  }

  const lenis = lenisInstance
  if (lenis) {
    try {
      lenis.animate?.stop?.()
      lenis.isScrolling = false
      lenis.velocity = 0
      lenis.lastVelocity = 0
      lenis.animatedScroll = targetY
      lenis.targetScroll = targetY
    } catch (_) {
      /* ignore */
    }
  }
}

/**
 * Resolve a hash/selector to a Y offset, or return a numeric Y as-is.
 * Returns null when a selector is not in the DOM yet.
 */
export function resolveScrollTarget(yOrSelector = 0) {
  if (typeof yOrSelector === 'string') {
    const el = document.querySelector(yOrSelector)
    if (!el) return null
    return Math.max(0, el.getBoundingClientRect().top + window.scrollY - 80)
  }
  return Math.max(0, Number(yOrSelector) || 0)
}

/**
 * Restore scroll position now and as layout/images settle.
 * target can be:
 * - a numeric Y offset (e.g. 1200)
 * - a CSS selector string (e.g. "#circular-categories")
 * - an object { sectionId?: string, y?: number }
 */
export function restoreScrollPositionSoon(
  target = 0,
  delays = [0, 25, 60, 120, 220, 380, 550, 800, 1200]
) {
  let cancelled = false

  const cancel = () => {
    cancelled = true
    cleanupListeners()
  }

  const cleanupListeners = () => {
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchmove', cancel)
    window.removeEventListener('pointerdown', cancel)
    window.removeEventListener('keydown', cancel)
  }

  window.addEventListener('wheel', cancel, { passive: true })
  window.addEventListener('touchmove', cancel, { passive: true })
  window.addEventListener('pointerdown', cancel, { passive: true })
  window.addEventListener('keydown', cancel, { passive: true })

  const resolveTargetY = () => {
    let selector = null
    let fallbackY = 0

    if (typeof target === 'string') {
      selector = target.startsWith('#') ? target : `#${target}`
    } else if (target && typeof target === 'object') {
      if (target.sectionId) {
        selector = target.sectionId.startsWith('#') ? target.sectionId : `#${target.sectionId}`
      }
      fallbackY = Math.max(0, Number(target.y) || 0)
    } else {
      fallbackY = Math.max(0, Number(target) || 0)
    }

    if (selector) {
      try {
        const el = document.querySelector(selector)
        if (el) {
          const rect = el.getBoundingClientRect()
          return Math.max(0, rect.top + window.scrollY - 80)
        }
      } catch (_) { }
    }

    return fallbackY
  }

  const applyScroll = () => {
    if (cancelled) return
    const targetY = resolveTargetY()
    suppressScrollRecording = true
    scrollToPosition(targetY)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        suppressScrollRecording = false
      })
    })
  }

  applyScroll()

  const timers = delays
    .filter((ms) => ms > 0)
    .map((ms) => window.setTimeout(applyScroll, ms))
  const raf = requestAnimationFrame(applyScroll)

  return () => {
    cancelled = true
    cleanupListeners()
    cancelAnimationFrame(raf)
    timers.forEach((id) => window.clearTimeout(id))
  }
}

