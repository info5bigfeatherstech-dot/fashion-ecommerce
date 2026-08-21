import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Tag, Zap } from 'lucide-react'
import { JEWELLERY_FEST } from '@/config/site'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { useBestsellers } from '@/features/product/hooks'
import { formatPrice } from '@/lib/utils'

function getEndOfDay() {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return end.getTime()
}

function useCountdown(targetMs) {
  const [remaining, setRemaining] = useState(() => Math.max(0, targetMs - Date.now()))

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, targetMs - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetMs])

  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  }
}

export function JewelleryFestSection() {
  const { data: products = [] } = useBestsellers()
  const endAt = useMemo(() => getEndOfDay(), [])
  const { hours, minutes, seconds } = useCountdown(endAt)

  const categoryCards = useMemo(() => {
    return JEWELLERY_FEST.categories.map((category, index) => {
      const product = products[index] || products[index % Math.max(products.length, 1)]
      const startingAt = product?.price ?? category.fallbackPrice
      const image = product?.images?.[0] || product?.image

      return {
        ...category,
        startingAt,
        image,
        productHref: product?.slug ? `/product/${product.slug}` : category.href,
      }
    })
  }, [products])

  return (
    <section className="section container">
      <div className="jewellery-fest">
        <div className="jewellery-fest__left">
          <div className="jewellery-fest__icon" aria-hidden="true">
            <Zap size={18} />
          </div>

          <Reveal x={-14} y={0}>
            <p className="jewellery-fest__eyebrow">{JEWELLERY_FEST.eyebrow}</p>
          </Reveal>
          <ScrollRevealText as="h2" className="jewellery-fest__title">
            {JEWELLERY_FEST.title}
          </ScrollRevealText>

          <Reveal delay={0.1}>
            <p className="jewellery-fest__offer">
              <span className="jewellery-fest__offer-dot" aria-hidden="true" />
              {JEWELLERY_FEST.offerLabel}
            </p>

            <div className="jewellery-fest__timer" role="timer" aria-live="polite" aria-label="Offer countdown">
              <div className="jewellery-fest__unit">
                <span className="jewellery-fest__unit-value">{hours}</span>
                <span className="jewellery-fest__unit-label">Hours</span>
              </div>
              <div className="jewellery-fest__unit">
                <span className="jewellery-fest__unit-value">{minutes}</span>
                <span className="jewellery-fest__unit-label">Minutes</span>
              </div>
              <div className="jewellery-fest__unit">
                <span className="jewellery-fest__unit-value">{seconds}</span>
                <span className="jewellery-fest__unit-label">Seconds</span>
              </div>
            </div>

            <Link to={JEWELLERY_FEST.ctaHref} className="jewellery-fest__cta">
              <Tag size={16} aria-hidden="true" />
              {JEWELLERY_FEST.ctaLabel}
            </Link>
          </Reveal>
        </div>

        <div className="jewellery-fest__right">
          <div className="jewellery-fest__panel-head">
            <h3 className="jewellery-fest__panel-title">{JEWELLERY_FEST.panelTitle}</h3>
            <span className="jewellery-fest__live">Live</span>
          </div>

          <div className="jewellery-fest__list">
            {categoryCards.map((item) => (
              <Link key={item.id} to={item.productHref} className="jewellery-fest__card">
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    className="jewellery-fest__card-image"
                    loading="lazy"
                  />
                )}
                <div className="jewellery-fest__card-body">
                  <h4 className="jewellery-fest__card-title">{item.title}</h4>
                  <p className="jewellery-fest__card-meta">
                    <span className="jewellery-fest__discount">{item.discount}% OFF</span>
                    <span aria-hidden="true"> · </span>
                    Starting at {formatPrice(item.startingAt)}
                  </p>
                </div>
                <span className="jewellery-fest__card-arrow" aria-hidden="true">
                  <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
