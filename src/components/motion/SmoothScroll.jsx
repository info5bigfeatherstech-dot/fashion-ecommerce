import { useEffect } from 'react'
import { setLenisInstance } from '@/lib/lenis'

/**
 * Smooth page scrolling (Lenis).
 * Pauses when a modal is open so nested scroll works.
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
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.85,
        touchMultiplier: 1,
        autoRaf: false,
        // Let dialogs / modals own the wheel scroll
        prevent: (node) =>
          Boolean(
            node?.closest?.(
              '.modal-content, [role="dialog"], [data-lenis-prevent], [data-radix-dialog-content]'
            )
          ),
      })

      setLenisInstance(lenis)

      const raf = (time) => {
        if (document.visibilityState === 'visible') {
          lenis?.raf(time)
        }
        rafId = requestAnimationFrame(raf)
      }
      rafId = requestAnimationFrame(raf)
    }

    start()

    return () => {
      cancelAnimationFrame(rafId)
      lenis?.destroy()
      setLenisInstance(null)
    }
  }, [])

  return null
}
