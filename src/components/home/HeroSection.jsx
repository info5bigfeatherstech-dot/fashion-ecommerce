import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { HERO_SLIDES } from '@/config/site'

export function HeroSection() {
  const [index, setIndex] = useState(0)
  const slide = HERO_SLIDES[index]

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return undefined

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % HERO_SLIDES.length)
    }, 6500)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Campaign highlights">
      <div className="hero__frame">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            className="hero__slide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <div className="hero__bg">
              <img src={slide.image} alt={slide.alt} />
            </div>
            <div className="hero__overlay" />
            <div className="hero__content">
              <p className="hero__eyebrow">{slide.eyebrow}</p>
              <h1 className="hero__title">{slide.title}</h1>
              <p className="hero__subtitle">{slide.subtitle}</p>
              <Link to={slide.href}>
                <Button variant="accent" size="lg">{slide.cta}</Button>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          className="hero__nav hero__nav--prev"
          onClick={() => setIndex((current) => (current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          aria-label="Previous slide"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          className="hero__nav hero__nav--next"
          onClick={() => setIndex((current) => (current + 1) % HERO_SLIDES.length)}
          aria-label="Next slide"
        >
          <ChevronRight size={22} />
        </button>

        <div className="hero__dots" role="tablist" aria-label="Hero slides">
          {HERO_SLIDES.map((item, i) => (
            <button
              key={item.id}
              className={`hero__dot ${i === index ? 'hero__dot--active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}: ${item.title}`}
              aria-current={i === index ? 'true' : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
