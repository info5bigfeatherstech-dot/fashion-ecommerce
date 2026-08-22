import { Link } from 'react-router-dom'
import { TOP_BANNER } from '@/config/site'

export function PromoBanner() {
  return (
    <div className="top-banner" role="region" aria-label="Promotion">
      <div className="top-banner__inner">
        <Link to={TOP_BANNER.href} className="top-banner__main">
          <span className="top-banner__headline">{TOP_BANNER.headline}</span>
          <span className="top-banner__divider" aria-hidden="true">·</span>
          <span className="top-banner__message">{TOP_BANNER.message}</span>
        </Link>
      </div>
    </div>
  )
}
