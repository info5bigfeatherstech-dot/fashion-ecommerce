import { useMemo } from 'react'
import { ProductCarousel } from '@/features/product/components/ProductCarousel'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { useProductsByTag } from '@/features/product/hooks'

const BESTSELLING_JEWELRY_TAG = 'bestselling-jewelry'
const BESTSELLING_LIMIT = 12
/** Wider fetch so session shuffle can vary which bestsellers surface. */
const BESTSELLING_FETCH_LIMIT = 48

export function BestsellersSection() {
  const { data, isLoading } = useProductsByTag(BESTSELLING_JEWELRY_TAG, {
    page: 1,
    limit: BESTSELLING_FETCH_LIMIT,
  })
  const products = useMemo(() => {
    try {
      const list = Array.isArray(data?.products) ? data.products : []
      return list.slice(0, BESTSELLING_LIMIT)
    } catch {
      return []
    }
  }, [data])

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
      </div>
      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : products.length > 0 ? (
        <Reveal delay={0.1}>
          <ProductCarousel products={products} autoplay autoplayInterval={3000} />
        </Reveal>
      ) : (
        <p className="body-sm text-muted">
          No bestselling jewelry tagged yet. Mark products with the Bestselling Jewelry tag in admin.
        </p>
      )}
      <p className="section-footnote">
        Loved for comfort, finish, and how easily they complete an outfit.
      </p>
    </section>
  )
}
