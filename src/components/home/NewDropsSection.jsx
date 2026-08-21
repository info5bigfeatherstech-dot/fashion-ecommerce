import { Link } from 'react-router-dom'
import { ProductCarousel } from '@/features/product/components/ProductCarousel'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { useNewArrivals } from '@/features/product/hooks'

export function NewDropsSection() {
  const { data: products, isLoading } = useNewArrivals()

  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <ScrollRevealText as="h2" className="display-md">
            New <span className="heading-accent heading-accent--gold">Jewelry Drops</span>
          </ScrollRevealText>
          <Reveal delay={0.08}>
            <p className="section-subheader">
              Just landed — fresh earrings, chains, and statement sets ready to layer, gift, and wear now.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.12}>
          <Link to="/shop?sort=newest" className="section-header__link">Shop All</Link>
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
