import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { HERO_SLIDES } from '@/config/site'

const IMAGE_SLIDE_MS = 7000

function bindHeroVideo(el) {
  if (!el) return
  el.muted = true
  el.defaultMuted = true
  el.volume = 0
  el.setAttribute('muted', '')
  el.playsInline = true
  const play = () => {
    el.currentTime = 0
    el.play().catch(() => {})
  }
  if (el.readyState >= 2) play()
  else el.addEventListener('loadeddata', play, { once: true })
}

export function HeroSection() {
  const [index, setIndex] = useState(0)
  const slide = HERO_SLIDES[index]

  const goNext = useCallback(() => {
    setIndex((current) => (current + 1) % HERO_SLIDES.length)
  }, [])

  const goPrev = useCallback(() => {
    setIndex((current) => (current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
  }, [])

  // Image slides only — video slides advance via onEnded.
  useEffect(() => {
    if (slide.video) return undefined
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return undefined

    const timer = setTimeout(goNext, IMAGE_SLIDE_MS)
    return () => clearTimeout(timer)
  }, [slide.video, slide.id, index, goNext])

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
              {slide.video ? (
                <video
                  key={slide.video}
                  ref={bindHeroVideo}
                  className="hero__video"
                  src={slide.video}
                  poster={slide.image}
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  disablePictureInPicture
                  aria-label={slide.alt}
                  onEnded={goNext}
                />
              ) : (
                <img src={slide.image} alt={slide.alt} />
              )}
            </div>
            <div className="hero__overlay" />
            <div className="hero__content">
              <Reveal y={18} delay={0.05}>
                <p className="hero__eyebrow">{slide.eyebrow}</p>
              </Reveal>
              <ScrollRevealText as="h1" className="hero__title">
                {slide.title}
              </ScrollRevealText>
              <Reveal y={18} delay={0.2}>
                <p className="hero__subtitle">{slide.subtitle}</p>
              </Reveal>
              <Reveal y={18} delay={0.32}>
                <Link to={slide.href}>
                  <Button variant="accent" size="lg">{slide.cta}</Button>
                </Link>
              </Reveal>
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          className="hero__nav hero__nav--prev"
          onClick={goPrev}
          aria-label="Previous slide"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          className="hero__nav hero__nav--next"
          onClick={goNext}
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
