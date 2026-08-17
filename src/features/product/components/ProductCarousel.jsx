import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from './ProductCard'

export function ProductCarousel({ products = [] }) {
  const trackRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft < maxScroll - 8)
  }, [])

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    if (!el) return undefined

    const onResize = () => updateArrows()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [products, updateArrows])

  const scrollByDir = (dir) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('.product-carousel__item')
    const gap = Number.parseFloat(getComputedStyle(el).gap) || 0
    const amount = card ? card.getBoundingClientRect().width + gap : el.clientWidth * 0.8
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  if (!products.length) return null

  return (
    <div className="product-carousel">
      <button
        type="button"
        className="product-carousel__btn product-carousel__btn--prev"
        onClick={() => scrollByDir(-1)}
        disabled={!canPrev}
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
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="product-carousel__btn product-carousel__btn--next"
        onClick={() => scrollByDir(1)}
        disabled={!canNext}
        aria-label="Scroll products right"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  )
}
