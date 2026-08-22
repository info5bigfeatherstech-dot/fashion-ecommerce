import { Link } from 'react-router-dom'
import { ArrowRight, Gift, Truck } from 'lucide-react'
import { TOP_BANNER } from '@/config/site'

export function PromoBanner() {
  return (
    <div className="top-banner" role="region" aria-label="Promotion">
      <div className="top-banner__inner">
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
    </div>
  )
}
