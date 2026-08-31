import { Link } from 'react-router-dom'
import { ProductCarousel } from '@/features/product/components/ProductCarousel'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { useBestsellers } from '@/features/product/hooks'

export function BestsellersSection() {
  const { data: products = [], isLoading } = useBestsellers({ limit: 12 })

  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <ScrollRevealText as="h2" className="display-md">
            Bestselling <span className="heading-accent heading-accent--gold">Jewelry</span>
          </ScrollRevealText>
          <Reveal delay={0.08}>
            <p className="section-subheader">
              The pieces customers wear on repeat — everyday staples and occasion-ready favorites.
            </p>
          </Reveal>
        </div>
        {/* <Reveal delay={0.12}>
          <Link to="/shop?sort=rating" className="section-header__link">Shop All</Link>
        </Reveal> */}
      </div>
      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <Reveal delay={0.1}>
          <ProductCarousel products={products} />
        </Reveal>
      )}
      <p className="section-footnote">
        Loved for comfort, finish, and how easily they complete an outfit.
      </p>
    </section>
  )
}
