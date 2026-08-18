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
          <h2 className="display-md">Bestselling <span className="heading-accent">Jewelry</span></h2>
          <p className="section-subheader">
            The pieces customers wear on repeat — everyday staples and occasion-ready favorites.
          </p>
        </div>
        <Link to="/shop?sort=rating" className="section-header__link">Shop All</Link>
      </div>
      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <ProductCarousel products={products} />
      )}
      <p className="section-footnote">
        Loved for comfort, finish, and how easily they complete an outfit.
      </p>
    </section>
  )
}
