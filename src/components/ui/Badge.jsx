import { cn, getBadgeClass, getBadgeLabel } from '@/lib/utils'

export function Badge({ badge, className, children }) {
  if (!badge && !children) return null
  return (
    <span className={cn('badge', badge && getBadgeClass(badge), className)}>
      {children || getBadgeLabel(badge)}
    </span>
  )
}
