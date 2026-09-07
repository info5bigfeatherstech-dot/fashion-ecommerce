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
 * Keeps Lenis internal state and the native scroller in lockstep so
 * route changes cannot paint (or settle) at a stale offset.
 */
export function scrollToPosition(y = 0) {
  const targetY = Math.max(0, Number(y) || 0)
  const lenis = lenisInstance

  suppressScrollRecording = true

  if (lenis) {
    // Cancel any in-flight lerp / wheel inertia, then snap.
    // Do not stop()/start() — that runs reset() and can re-sync from a
    // stale actualScroll during route transitions.
    lenis.animate?.stop?.()
    lenis.isScrolling = false
    lenis.velocity = 0
    lenis.lastVelocity = 0
    lenis.animatedScroll = targetY
    lenis.targetScroll = targetY
    lenis.scrollTo(targetY, { immediate: true, force: true })
    // Guaranteed native write even if scrollTo early-returns
    // (target === targetScroll) while the window is still offset.
    lenis.setScroll?.(targetY)
  }

  window.scrollTo({ top: targetY, left: 0, behavior: 'instant' })
  document.documentElement.scrollTop = targetY
  document.body.scrollTop = targetY

  // Scroll events can flush after this call; keep suppression through the next frame.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      suppressScrollRecording = false
    })
  })
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
