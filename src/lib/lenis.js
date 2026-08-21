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
  if (lenis?.scrollTo) {
    lenis.scrollTo(0, { immediate: true, force: true })
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}
