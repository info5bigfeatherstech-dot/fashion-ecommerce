import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FESTIVE_OFFER } from '@/config/site'
import { getPublicFestiveOffer } from '@/features/marketing/api'

export function FestiveOfferBadge() {
  const location = useLocation()
  const { data } = useQuery({
    queryKey: ['marketing', 'festive-offer'],
    queryFn: ({ signal }) => getPublicFestiveOffer({ signal }),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  })

  const visible = Boolean(data?.visible)
  const label = String(data?.label || '').trim()
  const href = String(data?.href || FESTIVE_OFFER.href).trim() || FESTIVE_OFFER.href

  if (!visible || !label) return null

  const isActive =
    location.pathname === href || location.pathname.startsWith(`${href}/`)

  return (
    <Link
      to={href}
      className={`sale-live-badge festive-offer-badge${isActive ? ' sale-live-badge--active' : ''}`}
      aria-label={`${label} — shop festive offers`}
    >
      <span className="sale-live-badge__live" aria-hidden="true">
        <span className="sale-live-badge__dot" />
        <span className="sale-live-badge__ring festive-offer-badge__ring" />
      </span>
      <span className="sale-live-badge__text">{label}</span>
    </Link>
  )
}
