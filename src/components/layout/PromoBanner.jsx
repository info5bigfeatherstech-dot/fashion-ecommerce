import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Gift, Truck } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { TOP_BANNER } from '@/config/site'

const ROTATE_MS = 3400

export function PromoBanner() {
  const reduceMotion = useReducedMotion()
  const lines = useMemo(
    () => [
      { text: TOP_BANNER.headline, Icon: Gift },
      { text: TOP_BANNER.message, Icon: Truck },
    ],
    [],
  )
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (reduceMotion || lines.length < 2) return undefined
    const id = window.setInterval(() => {
      setActive((index) => (index + 1) % lines.length)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [lines.length, reduceMotion])

  return (
    <div className="top-banner" role="region" aria-label="Promotion">
      <div className="top-banner__inner top-banner__inner--desktop">
        <Link to={TOP_BANNER.href} className="top-banner__promo">
          <span className="top-banner__badge">{TOP_BANNER.badge}</span>
          <span className="top-banner__copy">
            <Gift className="top-banner__icon" aria-hidden="true" strokeWidth={1.75} />
            <span className="top-banner__headline">{TOP_BANNER.headline}</span>
            <span className="top-banner__divider" aria-hidden="true" />
            <span className="top-banner__message">
              <Truck className="top-banner__message-icon" aria-hidden="true" strokeWidth={1.75} />
              {TOP_BANNER.message}
            </span>
          </span>
          <span className="top-banner__cta">
            {TOP_BANNER.cta}
            <ArrowRight className="top-banner__cta-icon" aria-hidden="true" strokeWidth={2} />
          </span>
        </Link>

        <p className="top-banner__terms">{TOP_BANNER.terms}</p>
      </div>

      <Link to={TOP_BANNER.href} className="top-banner__mobile">
        <span className="top-banner__mobile-badge">{TOP_BANNER.badge}</span>
        <span className="top-banner__mobile-viewport" aria-live="polite">
          {lines.map((line, index) => {
            const Icon = line.Icon
            const isActive = index === active
            const isPrev = index === (active - 1 + lines.length) % lines.length
            return (
              <span
                key={line.text}
                className={[
                  'top-banner__mobile-line',
                  isActive ? 'is-active' : '',
                  !isActive && isPrev ? 'is-exit' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Icon className="top-banner__mobile-icon" aria-hidden="true" strokeWidth={1.75} />
                <span>{line.text}</span>
              </span>
            )
          })}
        </span>
        <span className="top-banner__mobile-cta" aria-hidden="true">
          <ArrowRight size={14} strokeWidth={2} />
        </span>
      </Link>
    </div>
  )
}
