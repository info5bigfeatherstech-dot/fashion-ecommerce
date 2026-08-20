import { Link } from 'react-router-dom'
import { ProductCarousel } from '@/features/product/components/ProductCarousel'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { useBestsellers } from '@/features/product/hooks'

export function TheArchiveSection() {
  const { data: products = [], isLoading } = useBestsellers()
  const archiveProducts = products.slice(0, 12)

  return (
    <section className="section section--muted">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="display-md">The <span className="heading-accent">Archive</span></h2>
            <p className="section-subheader">
              Timeless favorites and past-season icons — the pieces our community keeps coming back to.
            </p>
          </div>
          <Link to="/shop?sort=rating" className="section-header__link">Explore Archive</Link>
        </div>
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <ProductCarousel products={archiveProducts} />
        )}
        <p className="section-footnote">
          Curated from our most-loved designs — limited runs, enduring style.
        </p>
      </div>
    </section>
  )
}
