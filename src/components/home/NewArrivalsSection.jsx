import { useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { NEW_ARRIVALS_SLIDES } from '@/config/site'
import { useBestsellers } from '@/features/product/hooks'

const AUTO_SLIDE_MS = 3500

export function NewArrivalsSection() {
  const trackRef = useRef(null)
  const pauseRef = useRef(false)
  const { data: products = [] } = useBestsellers()

  const slides = NEW_ARRIVALS_SLIDES.map((slide, index) => {
    const productImage = products[index]?.images?.[0] || products[index]?.image
    return {
      ...slide,
      image: productImage || slide.image,
    }
  })

  const scrollByDir = useCallback((dir) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('.new-arrivals-slide')
    const gap = Number.parseFloat(getComputedStyle(el).gap) || 16
    const amount = card ? card.getBoundingClientRect().width + gap : el.clientWidth * 0.75
    const maxScroll = el.scrollWidth - el.clientWidth

    if (dir > 0 && el.scrollLeft >= maxScroll - 8) {
      el.scrollTo({ left: 0, behavior: 'smooth' })
      return
    }
    if (dir < 0 && el.scrollLeft <= 8) {
      el.scrollTo({ left: maxScroll, behavior: 'smooth' })
      return
    }

    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      if (pauseRef.current) return
      scrollByDir(1)
    }, AUTO_SLIDE_MS)
    return () => clearInterval(id)
  }, [scrollByDir])

  return (
    <section className="section container new-arrivals-section">
      <div className="section-header new-arrivals-header">
        <div className="new-arrivals-header__copy">
          <h2 className="new-arrivals-pill">
            <span className="new-arrivals-pill__new">New</span>{' '}
            <span className="new-arrivals-pill__arrivals">Arrivals</span>
          </h2>
          <p className="new-arrivals-subheader">
            Browse through our curated collections crafted for every mood, celebration, and everyday elegance.
          </p>
        </div>

        <div className="new-arrivals-nav" aria-label="New arrivals slider controls">
          <button
            type="button"
            className="new-arrivals-nav__btn"
            onClick={() => scrollByDir(-1)}
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="new-arrivals-nav__btn"
            onClick={() => scrollByDir(1)}
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div
        className="new-arrivals-slider"
        onMouseEnter={() => { pauseRef.current = true }}
        onMouseLeave={() => { pauseRef.current = false }}
        onFocusCapture={() => { pauseRef.current = true }}
        onBlurCapture={() => { pauseRef.current = false }}
      >
        <div className="new-arrivals-slider__track" ref={trackRef}>
          {slides.map((slide, index) => (
            <Link
              key={slide.id}
              to={slide.href}
              className="new-arrivals-slide"
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="new-arrivals-slide__image"
                loading="lazy"
              />
              <div className="new-arrivals-slide__overlay" />
              <div className="new-arrivals-slide__copy">
                <h3 className="new-arrivals-slide__title">{slide.title}</h3>
                <p className="new-arrivals-slide__count">{slide.itemCount} Items</p>
                {index === 0 && (
                  <span className="new-arrivals-slide__shop">Shop Now</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
