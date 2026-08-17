import { Link } from 'react-router-dom'
import { ProductCarousel } from '@/features/product/components/ProductCarousel'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { useNewArrivals } from '@/features/product/hooks'

export function NewDropsSection() {
  const { data: products, isLoading } = useNewArrivals()

  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <p className="heading-sm text-accent">Just Launched</p>
          <h2 className="display-md">New Drops</h2>
        </div>
        <Link to="/shop/new-arrivals" className="section-header__link">View All</Link>
      </div>
      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <ProductCarousel products={products} />
      )}
    </section>
  )
}
