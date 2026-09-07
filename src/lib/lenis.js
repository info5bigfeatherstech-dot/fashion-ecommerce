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
