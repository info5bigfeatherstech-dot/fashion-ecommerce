import { Link } from 'react-router-dom'
import { DEEP_CATEGORIES } from '@/config/site'
import { CategoryGrid } from '@/features/category/components/CategoryCard'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'

export function ShopByCategorySection() {
  return (
    <section id="shop-by-category" className="section container">
      <div className="section-header">
        <div>
          <ScrollRevealText as="h2" className="display-md">
            Shop by <span className="heading-accent heading-accent--gold">Jewelry Style</span>
          </ScrollRevealText>
          <Reveal delay={0.08}>
            <p className="section-subheader">
              Browse earrings, necklaces, rings, and more — organized by the styles you reach for most.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.12}>
          <Link to="/shop" className="section-header__link">Shop All</Link>
        </Reveal>
      </div>
      <Reveal delay={0.1}>
        <CategoryGrid categories={DEEP_CATEGORIES} />
      </Reveal>
      <p className="section-footnote">
        Start with a category and discover pieces made to mix, match, and gift.
      </p>
    </section>
  )
}
