import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SALE_LIVE } from '@/config/site'
import { getPublicSaleLive } from '@/features/marketing/api'

export function SaleLiveBadge() {
  const location = useLocation()
  const { data } = useQuery({
    queryKey: ['marketing', 'sale-live'],
    queryFn: ({ signal }) => getPublicSaleLive({ signal }),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  })

  // Fail-open while loading / on soft errors: historic always-on badge.
  const label = String(data?.label || SALE_LIVE.label).trim() || SALE_LIVE.label
  const href = String(data?.href || SALE_LIVE.href).trim() || SALE_LIVE.href
  const visible = data == null ? true : Boolean(data.visible)

  if (!visible || !label) return null

  const isActive = location.pathname === href || location.pathname.startsWith(`${href}/`)

  return (
    <Link
      to={href}
      className={`sale-live-badge${isActive ? ' sale-live-badge--active' : ''}`}
      aria-label={`${label} — shop sale`}
    >
      <span className="sale-live-badge__live" aria-hidden="true">
        <span className="sale-live-badge__dot" />
        <span className="sale-live-badge__ring" />
      </span>
      <span className="sale-live-badge__text">{label}</span>
    </Link>
  )
}
