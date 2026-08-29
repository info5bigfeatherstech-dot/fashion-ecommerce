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
  scrollToPosition(0)
}

/** Jump to a specific scroll Y position (works with or without Lenis). */
export function scrollToPosition(y = 0) {
  const targetY = Math.max(0, y)
  const lenis = lenisInstance

  if (lenis) {
    lenis.scrollTo(targetY, { immediate: true, force: true })
  }

  window.scrollTo(0, targetY)
  document.documentElement.scrollTop = targetY
  document.body.scrollTop = targetY
}

/**
 * Reset scroll now and again after layout/images settle.
 * Returns a cleanup function that clears pending timers.
 */
export function scrollToTopSoon(delays = [0, 50, 150, 350, 700]) {
  return restoreScrollPositionSoon(0, delays)
}

/**
 * Restore scroll position now and as layout/images settle.
 * If yOrSelector is a string selector (e.g. "#circular-categories"),
 * dynamically calculates its top offset on each tick.
 */
export function restoreScrollPositionSoon(
  yOrSelector = 0,
  delays = [0, 20, 50, 100, 200, 350, 500, 750, 1000, 1500, 2000, 2500]
) {
  const applyScroll = () => {
    let targetY = 0
    if (typeof yOrSelector === 'string') {
      const el = document.querySelector(yOrSelector)
      if (el) {
        targetY = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 80)
      } else {
        return
      }
    } else {
      targetY = Math.max(0, yOrSelector)
    }

    scrollToPosition(targetY)
  }

  applyScroll()

  const timers = delays
    .filter((ms) => ms > 0)
    .map((ms) => window.setTimeout(applyScroll, ms))
  const raf = requestAnimationFrame(applyScroll)

  return () => {
    cancelAnimationFrame(raf)
    timers.forEach((id) => window.clearTimeout(id))
  }
}
