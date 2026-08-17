import { Link } from 'react-router-dom'
import { TOP_BANNER } from '@/config/site'

export function PromoBanner() {
  return (
    <div className="top-banner" role="region" aria-label="Promotion">
      <div className="top-banner__inner">
        <Link to={TOP_BANNER.href} className="top-banner__main">
          <span className="top-banner__badge">{TOP_BANNER.badge}</span>
          <span className="top-banner__lead">{TOP_BANNER.lead}</span>
          <span className="top-banner__code">{TOP_BANNER.code}</span>
          <span className="top-banner__message">{TOP_BANNER.message}</span>
        </Link>
        <Link to="/account" className="top-banner__terms">
          {TOP_BANNER.terms}
        </Link>
      </div>
    </div>
  )
}
