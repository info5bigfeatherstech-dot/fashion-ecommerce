import { useState, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BREAKPOINTS } from '@/config/breakpoints'

function getVisibleItems(width) {
  if (width >= BREAKPOINTS.desktop) return 4
  if (width >= BREAKPOINTS.tablet) return 3
  return 2
}

export function Carousel({ children, className, itemCount }) {
  const [index, setIndex] = useState(0)
  const [visibleItems, setVisibleItems] = useState(() =>
    typeof window !== 'undefined' ? getVisibleItems(window.innerWidth) : 2,
  )
  const maxIndex = Math.max(0, itemCount - visibleItems)

  useEffect(() => {
    const onResize = () => setVisibleItems(getVisibleItems(window.innerWidth))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    setIndex((current) => Math.min(current, maxIndex))
  }, [maxIndex])

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIndex((i) => Math.min(maxIndex, i + 1)), [maxIndex])

  return (
    <div className={cn('carousel', className)}>
      <div
        className="carousel-track carousel-track--grid"
        style={{ transform: `translateX(calc(-${index} * (100% / ${visibleItems} + var(--space-2))))` }}
      >
        {children}
      </div>
      {itemCount > visibleItems && (
        <div className="carousel-nav" style={{ marginTop: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button className="carousel-btn" onClick={prev} disabled={index === 0} aria-label="Previous">
            <ChevronLeft size={18} />
          </button>
          <button className="carousel-btn" onClick={next} disabled={index >= maxIndex} aria-label="Next">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
