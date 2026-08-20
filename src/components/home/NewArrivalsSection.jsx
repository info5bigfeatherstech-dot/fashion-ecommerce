import { Link } from 'react-router-dom'
import { ProductCarousel } from '@/features/product/components/ProductCarousel'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { useProductListing } from '@/features/product/hooks'

export function NewArrivalsSection() {
  const { data, isLoading } = useProductListing({ category: 'new-arrivals' })
  const products = data?.products?.slice(0, 12) ?? []

  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <h2 className="display-md">New <span className="heading-accent">Arrivals</span></h2>
          <p className="section-subheader">
            The season&apos;s first look — fresh earrings, chains, and sets made to wear now and keep reaching for.
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
        Updated weekly with the pieces landing first on VERAÒ.
      </p>
    </section>
  )
}
