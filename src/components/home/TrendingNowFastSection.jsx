import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { ProductCarousel } from '@/features/product/components/ProductCarousel'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { useBestsellers } from '@/features/product/hooks'

export function TrendingNowFastSection() {
  const { data: products = [], isLoading } = useBestsellers()
  const trendingProducts = products.slice(0, 12)

  return (
    <section className="section container container--wide trending-now-section">
      <div className="section-header">
        <div>
          <Reveal x={-14} y={0}>
            <span className="trending-now-badge">
              <TrendingUp size={14} aria-hidden="true" />
              Trending Jewellery
            </span>
          </Reveal>
          <ScrollRevealText as="h2" className="display-md">
            Moving Fast — Shop Before They’re Gone
          </ScrollRevealText>
          <Reveal delay={0.08}>
            <p className="section-subheader">
              Pieces climbing in popularity right now. Grab the looks everyone’s adding to cart.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.12}>
          <Link to="/shop?sort=rating" className="section-header__link">View All</Link>
        </Reveal>
      </div>
      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <Reveal delay={0.1}>
          <ProductCarousel products={trendingProducts} />
        </Reveal>
      )}
    </section>
  )
}
