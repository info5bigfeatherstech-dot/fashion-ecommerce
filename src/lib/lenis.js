let lenisInstance = null

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

/** Jump to top immediately (works with or without Lenis). */
export function scrollToTop() {
  const lenis = lenisInstance

  // Sync Lenis first so its internal offset matches window scroll.
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true })
  }

  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

/**
 * Reset scroll now and again after layout/images settle.
 * Returns a cleanup function that clears pending timers.
 */
export function scrollToTopSoon(delays = [0, 50, 150, 350, 700]) {
  scrollToTop()
  const timers = delays
    .filter((ms) => ms > 0)
    .map((ms) => window.setTimeout(() => scrollToTop(), ms))
  const raf = requestAnimationFrame(() => scrollToTop())

  return () => {
    cancelAnimationFrame(raf)
    timers.forEach((id) => window.clearTimeout(id))
  }
}
