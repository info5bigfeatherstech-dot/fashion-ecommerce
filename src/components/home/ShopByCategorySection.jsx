import { Link } from 'react-router-dom'
import { DEEP_CATEGORIES } from '@/config/site'
import { CategoryGrid } from '@/features/category/components/CategoryCard'

export function ShopByCategorySection() {
  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <h2 className="display-md">Shop by <span className="heading-accent heading-accent--gold">Jewelry Style</span></h2>
          <p className="section-subheader">
            Browse earrings, necklaces, rings, and more — organized by the styles you reach for most.
          </p>
        </div>
        <Link to="/shop" className="section-header__link">Shop All</Link>
      </div>
      <CategoryGrid categories={DEEP_CATEGORIES} />
      <p className="section-footnote">
        Start with a category and discover pieces made to mix, match, and gift.
      </p>
    </section>
  )
}