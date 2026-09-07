import { useEffect } from 'react'
import { setLenisInstance } from '@/lib/lenis'

/**
 * Smooth page scrolling (Lenis).
 * Pauses when a modal is open so nested scroll works.
 */
export function SmoothScroll() {
  // Lenis smooth scroll completely disabled to prevent scroll hijacking,
  // inertia overrides, and scroll restoration conflicts across page navigation.
  return null
}
