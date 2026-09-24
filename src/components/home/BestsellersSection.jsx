import { Link } from 'react-router-dom'
import { ProductCarousel } from '@/features/product/components/ProductCarousel'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { useHomeBestsellers } from '@/features/product/hooks'

/** 5 viewport scrolls × ~4 cards = 20 products per carousel loop. */
const BESTSELLING_LIMIT = 20

export function BestsellersSection() {
  const { data, isLoading } = useHomeBestsellers({ limit: BESTSELLING_LIMIT })
  const products = Array.isArray(data?.products) ? data.products : []

  return (
    <section id="bestsellers" className="section container">
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
        <Reveal delay={0.12}>
          <Link to="/shop/bestsellers" className="section-header__link">
            View All
          </Link>
        </Reveal>
      </div>
      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : products.length > 0 ? (
        <Reveal delay={0.1}>
          <ProductCarousel products={products} autoplay autoplayInterval={3000} />
        </Reveal>
      ) : (
        <p className="body-sm text-muted">
          No products available to show here yet. Add live products (or tag Bestselling Jewelry in admin).
        </p>
      )}
      <p className="section-footnote">
        Loved for comfort, finish, and how easily they complete an outfit.
      </p>
    </section>
  )
}
