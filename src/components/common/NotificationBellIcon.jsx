import { memo } from 'react'
import { Bell } from 'lucide-react'

function badgeText(count) {
  const n = Number(count) || 0
  if (n <= 0) return null
  return n > 9 ? '9+' : String(n)
}

export const NotificationBellIcon = memo(function NotificationBellIcon({
  count = 0,
  onClick,
  className = '',
  ariaLabel,
}) {
  const unread = Number(count) || 0
  const badge = badgeText(unread)
  const shouldShake = unread > 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={`header__util header__util--icon ${className}`}
      aria-label={ariaLabel || (unread > 0 ? `${unread} unread notifications` : 'Notifications')}
    >
      <span className="header__util-icon relative">
        <Bell
          size={22}
          className={shouldShake ? 'fab-notify-bell-shake' : ''}
          strokeWidth={2.1}
        />
        {badge && <span className="header__badge-count">{badge}</span>}
      </span>
      <span className="header__util-label">Alerts</span>
    </button>
  )
})
