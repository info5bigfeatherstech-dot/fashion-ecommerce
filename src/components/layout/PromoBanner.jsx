import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { ArrowRight, Gift, Truck } from 'lucide-react'
import { TOP_BANNER } from '@/config/site'

function BannerPromoItem() {
  return (
    <span className="top-banner__item">
      <span className="top-banner__copy">
        <Gift className="top-banner__icon" aria-hidden="true" strokeWidth={1.75} />
        <span className="top-banner__headline">{TOP_BANNER.headline}</span>
        <span className="top-banner__divider" aria-hidden="true" />
        <span className="top-banner__message">
          <Truck className="top-banner__message-icon" aria-hidden="true" strokeWidth={1.75} />
          <strong>{TOP_BANNER.message}</strong>
        </span>
      </span>
      <span className="top-banner__cta">
        {TOP_BANNER.cta}
        <ArrowRight className="top-banner__cta-icon" aria-hidden="true" strokeWidth={2} />
      </span>
    </span>
  )
}

export function PromoBanner() {
  const reduceMotion = useReducedMotion()
  const copies = reduceMotion ? 1 : 4

  return (
    <div className="top-banner" role="region" aria-label="Promotion">
      <Link
        to={TOP_BANNER.href}
        className={`top-banner__marquee${reduceMotion ? ' top-banner__marquee--static' : ''}`}
      >
        <span className="top-banner__track" aria-hidden={reduceMotion ? undefined : true}>
          {Array.from({ length: copies }, (_, i) => (
            <BannerPromoItem key={i} />
          ))}
        </span>
        {!reduceMotion && (
          <span className="sr-only">
            {TOP_BANNER.headline}. {TOP_BANNER.message}. {TOP_BANNER.cta}
          </span>
        )}
      </Link>
    </div>
  )
}
