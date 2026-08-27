import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { Reveal, ScrollRevealText } from '@/components/motion/ScrollRevealText'
import { ReflectiveCard } from '@/components/ui/ReflectiveCard'
import { useCircleCategories } from '@/features/category/hooks'

const AUTOPLAY_MS = 3200

export function CircularCategoriesSection() {
  const { data: categories = [] } = useCircleCategories()
  const reduceMotion = useReducedMotion()
  const trackRef = useRef(null)
  const pauseRef = useRef(false)
  const [canScroll, setCanScroll] = useState(false)

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanScroll(maxScroll > 8)
  }, [])

  const scrollByDir = useCallback((dir, { loop = false } = {}) => {
    const el = trackRef.current
    if (!el) return

    const item = el.querySelector('.circle-categories__item-wrap')
    const gap = Number.parseFloat(getComputedStyle(el).gap) || 0
    const amount = item ? item.getBoundingClientRect().width + gap : el.clientWidth * 0.75
    const maxScroll = el.scrollWidth - el.clientWidth

    if (loop && dir > 0 && el.scrollLeft >= maxScroll - 8) {
      el.scrollTo({ left: 0, behavior: 'smooth' })
      return
    }
    if (loop && dir < 0 && el.scrollLeft <= 8) {
      el.scrollTo({ left: maxScroll, behavior: 'smooth' })
      return
    }

    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    if (!el) return undefined

    const onResize = () => updateArrows()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [categories, updateArrows])

  useEffect(() => {
    if (reduceMotion || categories.length < 2 || !canScroll) return undefined

    const id = window.setInterval(() => {
      if (pauseRef.current) return
      scrollByDir(1, { loop: true })
    }, AUTOPLAY_MS)

    return () => window.clearInterval(id)
  }, [categories.length, canScroll, reduceMotion, scrollByDir])

  const pauseAutoplay = () => {
    pauseRef.current = true
  }

  const resumeAutoplay = () => {
    pauseRef.current = false
  }

  return (
    <section id="circular-categories" className="circle-categories" aria-labelledby="circle-categories-heading">
      <div className="container circle-categories__inner">
        <div className="section-header circle-categories__header">
          <div>
            <Reveal>
              <p className="circle-categories__eyebrow">
                <span className="circle-categories__eyebrow-rule" aria-hidden="true" />
                Explore
              </p>
            </Reveal>
            <ScrollRevealText as="h2" id="circle-categories-heading" className="display-md">
              Shop by <span className="heading-accent heading-accent--gold">Category</span>
            </ScrollRevealText>
            <Reveal delay={0.08}>
              <p className="section-subheader circle-categories__subheader">
                From everyday essentials to statement gifting — find your perfect piece.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <Link to="/shop/women" className="section-header__link">
              View all
            </Link>
          </Reveal>
        </div>

        {categories.length > 0 ? (
          <div
            className="circle-categories__slider"
            onMouseEnter={pauseAutoplay}
            onMouseLeave={resumeAutoplay}
            onFocusCapture={pauseAutoplay}
            onBlurCapture={resumeAutoplay}
            onTouchStart={pauseAutoplay}
            onTouchEnd={resumeAutoplay}
          >
            <button
              type="button"
              className="circle-categories__btn circle-categories__btn--prev"
              onClick={() => scrollByDir(-1, { loop: true })}
              disabled={!canScroll}
              aria-label="Previous categories"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>

            <div
              className="circle-categories__track"
              ref={trackRef}
              role="list"
              onScroll={updateArrows}
            >
              {categories.map((category, index) => (
                <Reveal key={category.id} delay={index * 0.04} className="circle-categories__item-wrap">
                  <Link
                    to={category.href}
                    className="circle-categories__item"
                    role="listitem"
                    aria-label={category.label}
                  >
                    <ReflectiveCard
                      as="div"
                      className="circle-categories__ring-card"
                      maxTilt={10}
                      glareOpacity={0.45}
                    >
                      <span className="circle-categories__ring">
                        <span className="circle-categories__ring-inner">
                          <img src={category.image} alt="" loading="lazy" />
                          <span className="circle-categories__shine" aria-hidden="true" />
                        </span>
                      </span>
                    </ReflectiveCard>
                    <span className="circle-categories__label">{category.label}</span>
                  </Link>
                </Reveal>
              ))}
            </div>

            <button
              type="button"
              className="circle-categories__btn circle-categories__btn--next"
              onClick={() => scrollByDir(1, { loop: true })}
              disabled={!canScroll}
              aria-label="Next categories"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
