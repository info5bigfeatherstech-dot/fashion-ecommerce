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
  // Stop Lenis so its RAF loop doesn't override the scroll position
  lenis?.stop?.()
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
  // Re-start Lenis on the next frame so it picks up the new position
  requestAnimationFrame(() => {
    lenis?.start?.()
    lenis?.scrollTo?.(0, { immediate: true, force: true })
  })
}
