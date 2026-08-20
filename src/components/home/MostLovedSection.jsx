import { Link } from 'react-router-dom'
import { ProductCarousel } from '@/features/product/components/ProductCarousel'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { useProductListing } from '@/features/product/hooks'

export function MostLovedSection() {
  const { data, isLoading } = useProductListing({ sort: 'rating' })
  const products = data?.products?.slice(0, 12) ?? []

  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <h2 className="display-md">Most Loved <span className="heading-accent">This Season</span></h2>
          <p className="section-subheader">
            Top-rated picks from our community — the jewelry pieces earning the most love right now.
          </p>
        </div>
        <Link to="/shop?sort=rating" className="section-header__link">View All</Link>
      </div>
      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <ProductCarousel products={products} />
      )}
      <p className="section-footnote">
        Ranked by customer ratings and reviews — discover what everyone is wearing.
      </p>
    </section>
  )
}
