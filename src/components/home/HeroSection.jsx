import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { HERO_SLIDES } from '@/config/site'

function useHeroVideo(src) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !src) return undefined

    el.muted = true
    el.defaultMuted = true
    el.volume = 0
    el.setAttribute('muted', '')
    el.playsInline = true
    el.loop = true

    const play = () => {
      el.play().catch(() => {})
    }

    if (el.readyState >= 2) play()
    else el.addEventListener('loadeddata', play, { once: true })

    const onVisibility = () => {
      if (document.visibilityState === 'visible') play()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [src])

  return ref
}

export function HeroSection() {
  const slide = HERO_SLIDES[0]
  const videoRef = useHeroVideo(slide?.video)

  if (!slide) return null

  const handleScrollToCategory = (e) => {
    e.preventDefault()
    const categorySection = document.getElementById('circular-categories')
    if (categorySection) {
      categorySection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className="hero" aria-label="Campaign highlight">
      <div className="hero__frame">
        <div className="hero__slide">
          <div className="hero__bg">
            {slide.video ? (
              <video
                ref={videoRef}
                className="hero__video"
                src={slide.video}
                poster={slide.image}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                disablePictureInPicture
                aria-label={slide.alt}
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
              {slide.title.includes('Speaks Your Language') ? (
                <>
                  {slide.title.split('Speaks Your Language')[0]}
                  <span className="hero__title-gold">Speaks Your Language</span>
                </>
              ) : (
                slide.title
              )}
            </ScrollRevealText>
            <Reveal y={18} delay={0.2}>
              <p className="hero__subtitle">{slide.subtitle}</p>
            </Reveal>
            <Reveal y={18} delay={0.32}>
              <Button variant="accent" size="lg" onClick={handleScrollToCategory}>
                {slide.cta}
              </Button>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
