import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { ReflectiveCard } from '@/components/ui/ReflectiveCard'
import { useProductsByTag } from '@/features/product/hooks'
import { formatPrice } from '@/lib/utils'

const AUTO_SLIDE_MS = 3500
const TODAY_DEAL_TAG = 'today-arrival'
const TODAY_DEAL_LIMIT = 12

function productImage(product) {
  return product?.image || product?.images?.[0] || null
}

function isActiveTodayDeal(product) {
  if (!product) return false
  if (Boolean(product.isTodayDeal) || Boolean(product.todayDeal)) return true
  const tags = Array.isArray(product.tags) ? product.tags : []
  return tags.some((tag) => {
    const t = String(tag).toLowerCase().trim()
    return t === TODAY_DEAL_TAG || t === 'today-deal' || t === 'today'
  })
}

function buildTodayDealSlides(products = []) {
  return products
    .filter((product) => isActiveTodayDeal(product) && product?.slug && productImage(product))
    .map((product) => ({
      id: `deal-${product.id || product.slug}`,
      title: product.name || product.title || 'Today’s deal',
      subtitle: product.price != null ? formatPrice(product.price) : 'Limited offer',
      href: `/product/${product.slug}`,
      image: productImage(product),
    }))
}

export function NewArrivalsSection() {
  const trackRef = useRef(null)
  const pauseRef = useRef(false)
  const { data, isLoading } = useProductsByTag(TODAY_DEAL_TAG, {
    page: 1,
    limit: TODAY_DEAL_LIMIT,
  })

  const slides = useMemo(
    () => buildTodayDealSlides(data?.products ?? []),
    [data?.products]
  )

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
    if (slides.length < 2) return undefined
    const id = setInterval(() => {
      if (pauseRef.current) return
      scrollByDir(1)
    }, AUTO_SLIDE_MS)
    return () => clearInterval(id)
  }, [scrollByDir, slides.length])

  // Hide the whole block unless at least one product has Today Deal active.
  if (!isLoading && slides.length === 0) return null

  return (
    <section className="section container new-arrivals-section">
      <div className="section-header new-arrivals-header">
        <div className="new-arrivals-header__copy">
          <ScrollRevealText as="h2" className="new-arrivals-pill">
            <span className="new-arrivals-pill__new">Today’s</span>{' '}
            <span className="new-arrivals-pill__arrivals">Deals</span>
          </ScrollRevealText>
          <Reveal delay={0.08}>
            <p className="new-arrivals-subheader">
              Only products marked as Today Deals in admin appear here.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="new-arrivals-nav" aria-label="Today’s deals slider controls">
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
        </Reveal>
      </div>

      {isLoading ? (
        <p className="body-sm text-muted">Loading today’s deals…</p>
      ) : (
        <div
          className="new-arrivals-slider"
          onMouseEnter={() => { pauseRef.current = true }}
          onMouseLeave={() => { pauseRef.current = false }}
          onFocusCapture={() => { pauseRef.current = true }}
          onBlurCapture={() => { pauseRef.current = false }}
        >
          <div className="new-arrivals-slider__track" ref={trackRef}>
            {slides.map((slide) => (
              <ReflectiveCard
                key={slide.id}
                as={Link}
                to={slide.href}
                className="new-arrivals-slide"
                maxTilt={6}
                glareOpacity={0.4}
                aria-label={slide.title}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="new-arrivals-slide__image"
                  loading="lazy"
                />
                <span className="new-arrivals-slide__shine" aria-hidden="true" />
                <div className="new-arrivals-slide__overlay" />
                <div className="new-arrivals-slide__copy">
                  <h3 className="new-arrivals-slide__title">{slide.title}</h3>
                  <p className="new-arrivals-slide__count">{slide.subtitle}</p>
                  <span className="new-arrivals-slide__shop">Shop Now</span>
                </div>
              </ReflectiveCard>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
