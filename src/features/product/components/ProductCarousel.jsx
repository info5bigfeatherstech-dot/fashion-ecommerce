import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from './ProductCard'

export function ProductCarousel({
  products = [],
  compact = false,
  mobileOnly = false,
  autoplay = false,
  autoplayInterval = 2200,
}) {
  const trackRef = useRef(null)
  const pauseRef = useRef(false)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft < maxScroll - 8)
  }, [])

  const scrollTo = useCallback((el, left) => {
    const restoreSnap = () => {
      el.style.scrollSnapType = ''
      el.removeEventListener('scrollend', restoreSnap)
    }
    // Snap-stop would otherwise halt a multi-card jump on the first card.
    el.style.scrollSnapType = 'none'
    el.scrollTo({ left, behavior: 'smooth' })
    el.addEventListener('scrollend', restoreSnap)
    window.setTimeout(restoreSnap, 800)
  }, [])

  const scrollByDir = useCallback((dir, { loop = false } = {}) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('.product-carousel__item')
    const gap = Number.parseFloat(getComputedStyle(el).gap) || 0
    const cardWidth = card ? card.getBoundingClientRect().width : el.clientWidth * 0.8
    const pageSize = Math.max(1, Math.round((el.clientWidth + gap) / (cardWidth + gap)))
    const amount = (cardWidth + gap) * pageSize
    const maxScroll = el.scrollWidth - el.clientWidth

    if (loop && dir > 0 && el.scrollLeft >= maxScroll - 16) {
      scrollTo(el, 0)
      return
    }
    if (loop && dir < 0 && el.scrollLeft <= 16) {
      scrollTo(el, maxScroll)
      return
    }

    const target = Math.max(0, Math.min(maxScroll, el.scrollLeft + dir * amount))
    scrollTo(el, target)
  }, [scrollTo])

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    if (!el) return undefined

    const onResize = () => updateArrows()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [products, updateArrows])

  useEffect(() => {
    if (!autoplay || products.length < 2) return undefined

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return undefined

    const id = window.setInterval(() => {
      if (pauseRef.current) return
      scrollByDir(1, { loop: true })
    }, autoplayInterval)

    return () => window.clearInterval(id)
  }, [autoplay, autoplayInterval, products.length, scrollByDir])

  if (!products.length) return null

  const pause = () => {
    pauseRef.current = true
  }
  const resume = () => {
    pauseRef.current = false
  }

  return (
    <div
      className={`product-carousel${mobileOnly ? ' product-carousel--mobile-only' : ''}${autoplay ? ' product-carousel--autoplay' : ''}`}
      onMouseEnter={autoplay ? pause : undefined}
      onMouseLeave={autoplay ? resume : undefined}
      onFocusCapture={autoplay ? pause : undefined}
      onBlurCapture={autoplay ? resume : undefined}
      onTouchStart={autoplay ? pause : undefined}
      onTouchEnd={autoplay ? resume : undefined}
    >
      <button
        type="button"
        className="product-carousel__btn product-carousel__btn--prev"
        onClick={() => scrollByDir(-1, { loop: autoplay })}
        disabled={!canPrev && !autoplay}
        aria-label="Scroll products left"
      >
        <ChevronLeft size={22} />
      </button>

      <div
        className="product-carousel__track"
        ref={trackRef}
        onScroll={updateArrows}
      >
        {products.map((product) => (
          <div key={product.id} className="product-carousel__item">
            <ProductCard product={product} compact={compact} />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="product-carousel__btn product-carousel__btn--next"
        onClick={() => scrollByDir(1, { loop: autoplay })}
        disabled={!canNext && !autoplay}
        aria-label="Scroll products right"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  )
}
