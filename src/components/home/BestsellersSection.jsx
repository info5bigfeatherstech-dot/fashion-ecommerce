import { Link } from 'react-router-dom'
import { ProductCard } from '@/features/product/components/ProductCard'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { useBestsellers } from '@/features/product/hooks'

export function BestsellersSection() {
  const { data: products, isLoading } = useBestsellers()

  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <p className="heading-sm">Customer Favorites</p>
          <h2 className="display-md">Bestsellers</h2>
        </div>
        <Link to="/shop?sort=rating" className="section-header__link">Shop All</Link>
      </div>
      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : (
        <div className="grid-4">
          {products?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
