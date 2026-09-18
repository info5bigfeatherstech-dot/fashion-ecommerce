import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { ProductCarousel } from '@/features/product/components/ProductCarousel'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { useFeaturedProducts } from '@/features/product/hooks'
import { splitFeaturedForHomeSections } from '@/lib/shuffleProducts'

export function TrendingNowFastSection() {
  const { data: rawProducts, isLoading } = useFeaturedProducts({ limit: 50 })

  const products = useMemo(() => {
    try {
      const list = Array.isArray(rawProducts) ? rawProducts : rawProducts?.products ?? []
      const featured = list.filter((p) => p && p.isFeatured !== false)
      const { movingFast } = splitFeaturedForHomeSections(featured)
      return movingFast
    } catch {
      const list = Array.isArray(rawProducts) ? rawProducts : []
      return list.filter((p) => p && p.isFeatured !== false)
    }
  }, [rawProducts])

  if (!isLoading && products.length === 0) {
    return null
  }

  return (
    <section id="trending-now" className="section container trending-now-section" aria-label="Moving fast">
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
              Fresh featured pieces moving fast right now — grab them before they’re gone.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.12}>
          <Link to="/shop/new-arrivals" className="section-header__link">
            Shop All
          </Link>
        </Reveal>
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <Reveal delay={0.1}>
          <ProductCarousel products={products} autoplay autoplayInterval={3000} />
        </Reveal>
      )}
    </section>
  )
}
