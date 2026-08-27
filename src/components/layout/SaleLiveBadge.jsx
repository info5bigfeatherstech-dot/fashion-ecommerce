import { Link, useLocation } from 'react-router-dom'
import { SALE_LIVE } from '@/config/site'

export function SaleLiveBadge() {
  const location = useLocation()
  const isActive = location.pathname === SALE_LIVE.href || location.pathname.startsWith(`${SALE_LIVE.href}/`)

  return (
    <Link
      to={SALE_LIVE.href}
      className={`sale-live-badge${isActive ? ' sale-live-badge--active' : ''}`}
      aria-label={`${SALE_LIVE.label} — shop sale`}
    >
      <span className="sale-live-badge__live" aria-hidden="true">
        <span className="sale-live-badge__dot" />
        <span className="sale-live-badge__ring" />
      </span>
      <span className="sale-live-badge__text">{SALE_LIVE.label}</span>
    </Link>
  )
}
