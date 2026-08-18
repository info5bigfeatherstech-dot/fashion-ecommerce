import { Link } from 'react-router-dom'
import { ProductCarousel } from '@/features/product/components/ProductCarousel'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { useBestsellers } from '@/features/product/hooks'

export function BestsellersSection() {
  const { data: products, isLoading } = useBestsellers()

  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <h2 className="display-md ">Bestselling <span className="text-accent" style={{ fontFamily: 'var(--font-ui)' }}>Jewelry</span></h2>
        </div>
        <Link to="/shop?sort=rating" className="section-header__link">Shop All</Link>
      </div>
      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <ProductCarousel products={products} />
      )}
    </section>
  )
}
