import { useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Reflective glare card (React Bits–style).
 * Soft 3D tilt + pointer-following specular highlight.
 */
export function ReflectiveCard({
  children,
  className = '',
  as: Comp = 'div',
  maxTilt = 8,
  glareOpacity = 0.42,
  ...props
}) {
  const ref = useRef(null)
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const handleMove = (event) => {
    if (reduceMotion) return
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    const rotateX = (0.5 - y) * maxTilt
    const rotateY = (x - 0.5) * maxTilt

    el.style.setProperty('--rc-rx', `${rotateX.toFixed(2)}deg`)
    el.style.setProperty('--rc-ry', `${rotateY.toFixed(2)}deg`)
    el.style.setProperty('--rc-mx', `${(x * 100).toFixed(2)}%`)
    el.style.setProperty('--rc-my', `${(y * 100).toFixed(2)}%`)
    el.style.setProperty('--rc-glare', String(glareOpacity))
    el.dataset.active = 'true'
  }

  const handleLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rc-rx', '0deg')
    el.style.setProperty('--rc-ry', '0deg')
    el.style.setProperty('--rc-glare', '0')
    el.dataset.active = 'false'
  }

  return (
    <Comp
      ref={ref}
      className={cn('reflective-card', className)}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      {...props}
    >
      <div className="reflective-card__inner">
        {children}
        <span className="reflective-card__glare" aria-hidden="true" />
        <span className="reflective-card__sheen" aria-hidden="true" />
      </div>
    </Comp>
  )
}
