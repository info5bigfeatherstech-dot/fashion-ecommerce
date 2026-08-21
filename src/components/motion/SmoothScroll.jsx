import { useEffect } from 'react'

/**
 * Slow, smooth page scrolling (Lenis).
 * Disabled when the user prefers reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduceMotion.matches) return undefined

    let rafId = 0
    let lenis

    async function start() {
      const { default: Lenis } = await import('lenis')
      lenis = new Lenis({
        duration: 1.55,
        easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.72,
        touchMultiplier: 0.9,
      })

      const raf = (time) => {
        lenis?.raf(time)
        rafId = requestAnimationFrame(raf)
      }
      rafId = requestAnimationFrame(raf)
    }

    start()

    return () => {
      cancelAnimationFrame(rafId)
      lenis?.destroy()
    }
  }, [])

  return null
}
