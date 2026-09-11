import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { ProductCarousel } from '@/features/product/components/ProductCarousel'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { useFeaturedProducts } from '@/features/product/hooks'

export function NewArrivalsSection() {
  const { data: rawProducts, isLoading } = useFeaturedProducts({ limit: 50 })

  const products = useMemo(() => {
    const list = Array.isArray(rawProducts) ? rawProducts : rawProducts?.products ?? []
    return list.filter((p) => p && p.isFeatured !== false)
  }, [rawProducts])

  if (!isLoading && products.length === 0) return null

  return (
    <section id="new-arrivals" className="section container new-arrivals-section" aria-label="New arrivals">
      <div className="section-header">
        <div>
          <ScrollRevealText as="h2" className="display-md">
            New <span className="heading-accent heading-accent--gold">Arrivals</span>
          </ScrollRevealText>
          <Reveal delay={0.08}>
            <p className="section-subheader">
              Freshly Curated and Handcrafted — Explore all our Latest Featured Pieces.
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
          <ProductCarousel products={products} />
        </Reveal>
      )}
    </section>
  )
}

