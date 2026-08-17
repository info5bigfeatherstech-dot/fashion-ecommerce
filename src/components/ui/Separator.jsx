import { cn } from '@/lib/utils'

export function Separator({ className, orientation = 'horizontal' }) {
  return (
    <hr
      className={cn(
        'separator',
        orientation === 'vertical' && 'separator--vertical',
        className
      )}
    />
  )
}
