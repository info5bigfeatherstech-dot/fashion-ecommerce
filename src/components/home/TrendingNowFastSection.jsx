import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { ProductCarousel } from '@/features/product/components/ProductCarousel'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { useBestsellers } from '@/features/product/hooks'

export function TrendingNowFastSection() {
  const { data: products = [], isLoading } = useBestsellers()
  const trendingProducts = products.slice(0, 12)

  return (
    <section className="section container container--wide trending-now-section">
      <div className="section-header">
        <div>
          <span className="trending-now-badge">
            <TrendingUp size={14} aria-hidden="true" />
            Trending Jewellery
          </span>
          <h2 className="display-md">
            Trending Now <span className="heading-accent">This Season</span>
          </h2>
          <p className="section-subheader trending-now-subheader">
            The fastest-moving favorites — selling out and getting restocked quickly.
          </p>
        </div>
        <Link to="/shop?sort=rating" className="section-header__link">View All</Link>
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <ProductCarousel products={trendingProducts} autoplay autoplayInterval={2000} />
      )}

      <p className="section-footnote">
        Ranked by sold popularity and customer reviews — so you see what shoppers love first.
      </p>
    </section>
  )
}

