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
          <h2 className="display-md">New <span className="heading-accent">Jewelry Drops</span></h2>
          <p className="section-subheader">
            Just landed — fresh earrings, chains, and statement sets ready to layer, gift, and wear now.
          </p>
        </div>
        <Link to="/shop/new-arrivals" className="section-header__link">View All</Link>
      </div>
      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <ProductCarousel products={products} />
      )}
      <p className="section-footnote">
        New styles drop regularly. Shop the latest edit before it sells out.
      </p>
    </section>
  )
}
