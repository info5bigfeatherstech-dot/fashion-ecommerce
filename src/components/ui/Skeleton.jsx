import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" {...props} />
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card">
      <Skeleton className="skeleton--image" />
      <div className="product-card__body">
        <Skeleton className="skeleton--text" />
        <Skeleton className="skeleton--text" style={{ width: '40%' }} />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 4 }) {
  return (
    <div className="grid-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
