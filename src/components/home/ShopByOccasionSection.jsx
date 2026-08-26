import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { SHOP_BY_OCCASION } from '@/config/site'
import { Reveal, ScrollRevealText } from '@/components/motion/ScrollRevealText'
import { BREAKPOINTS } from '@/config/breakpoints'

const DEFAULT_ACTIVE = 2
const FLEX_ACTIVE = 4.8
const FLEX_INACTIVE = 1
const PANEL_EASE = [0.22, 1, 0.36, 1]
const PANEL_DURATION = 0.72

function bindSilentLoop(el) {
  if (!el) return
  el.muted = true
  el.defaultMuted = true
  el.volume = 0
  el.setAttribute('muted', '')
  el.playsInline = true
  const play = () => {
    el.play().catch(() => {})
  }
  if (el.readyState >= 2) play()
  else el.addEventListener('loadeddata', play, { once: true })
}

function useIsMobile(breakpoint = BREAKPOINTS.tablet) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false,
  )

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [breakpoint])

  return isMobile
}

function getPanelWidths(panelCount) {
  const totalFlex = FLEX_ACTIVE + (panelCount - 1) * FLEX_INACTIVE
  return {
    active: `${(FLEX_ACTIVE / totalFlex) * 100}%`,
    inactive: `${(FLEX_INACTIVE / totalFlex) * 100}%`,
  }
}

export function ShopByOccasionSection() {
  const [activeIndex, setActiveIndex] = useState(DEFAULT_ACTIVE)
  const isMobile = useIsMobile()
  const reduceMotion = useReducedMotion()
  const { eyebrow, panels } = SHOP_BY_OCCASION
  const { active: activeWidth, inactive: inactiveWidth } = getPanelWidths(panels.length)

  const panelTransition = reduceMotion
    ? { duration: 0 }
    : { duration: PANEL_DURATION, ease: PANEL_EASE }

  const contentTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: PANEL_EASE }

  if (isMobile) return null

  return (
    <section className="shop-occasion" aria-labelledby="shop-occasion-heading">
      <div className="container shop-occasion__inner">
        <div className="section-header shop-occasion__header">
          <div>
            <Reveal>
              <p className="shop-occasion__eyebrow">
                <span className="shop-occasion__eyebrow-rule" aria-hidden="true" />
                {eyebrow}
              </p>
            </Reveal>
            <ScrollRevealText as="h2" id="shop-occasion-heading" className="display-md">
              Shop By <span className="heading-accent heading-accent--gold">Occasion</span>
            </ScrollRevealText>
          </div>
        </div>

        <div
          className="occasion-accordion"
          onMouseLeave={() => setActiveIndex(DEFAULT_ACTIVE)}
        >
          {panels.map((panel, index) => {
            const isActive = activeIndex === index

            return (
              <motion.div
                key={panel.id}
                className="occasion-accordion__panel-wrap"
                initial={false}
                animate={{
                  width: isActive ? activeWidth : inactiveWidth,
                  height: '100%',
                }}
                transition={panelTransition}
                onMouseEnter={() => setActiveIndex(index)}
                onFocusCapture={() => setActiveIndex(index)}
              >
                <Link
                  to={panel.href}
                  className={`occasion-accordion__panel${isActive ? ' is-active' : ''}`}
                  aria-label={panel.title}
                  onClick={() => setActiveIndex(index)}
                >
                  <span className="occasion-accordion__media" aria-hidden="true">
                    {panel.video ? (
                      <motion.video
                        ref={bindSilentLoop}
                        src={panel.video}
                        poster={panel.image}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        initial={false}
                        animate={{
                          scale: isActive ? 1.06 : 1,
                          filter: isActive
                            ? 'grayscale(0) brightness(1)'
                            : 'grayscale(1) brightness(0.68)',
                        }}
                        transition={{
                          ...contentTransition,
                          delay: reduceMotion ? 0 : isActive ? 0.08 : 0,
                        }}
                      />
                    ) : (
                      <motion.img
                        src={panel.image}
                        alt={panel.alt}
                        loading="lazy"
                        initial={false}
                        animate={{
                          scale: isActive ? 1.06 : 1,
                          filter: isActive
                            ? 'grayscale(0) brightness(1)'
                            : 'grayscale(1) brightness(0.68)',
                        }}
                        transition={{
                          ...contentTransition,
                          delay: reduceMotion ? 0 : isActive ? 0.08 : 0,
                        }}
                      />
                    )}
                  </span>
                  <motion.span
                    className="occasion-accordion__overlay"
                    aria-hidden="true"
                    initial={false}
                    animate={{ opacity: isActive ? 1 : 0.92 }}
                    transition={contentTransition}
                  />

                  <span className="occasion-accordion__index">{panel.number}</span>

                  <motion.span
                    className="occasion-accordion__label-vertical"
                    initial={false}
                    animate={{ opacity: isActive ? 0 : 1 }}
                    transition={{
                      ...contentTransition,
                      delay: reduceMotion ? 0 : isActive ? 0 : 0.06,
                    }}
                  >
                    {panel.label}
                  </motion.span>

                  <motion.span
                    className="occasion-accordion__expanded"
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      y: isActive ? 0 : 18,
                    }}
                    transition={{
                      ...contentTransition,
                      delay: reduceMotion ? 0 : isActive ? 0.14 : 0,
                    }}
                  >
                    <motion.span
                      className="occasion-accordion__title"
                      initial={false}
                      animate={{
                        opacity: isActive ? 1 : 0,
                        y: isActive ? 0 : 12,
                      }}
                      transition={{
                        ...contentTransition,
                        delay: reduceMotion ? 0 : isActive ? 0.22 : 0,
                      }}
                    >
                      {panel.title}
                    </motion.span>
                  </motion.span>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
