import { DEEP_CATEGORIES } from '@/config/site'
import { CategoryGrid } from '@/features/category/components/CategoryCard'

export function ShopByCategorySection() {
  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <p className="heading-sm">Collections</p>
          <h2 className="display-md">Shop by Category</h2>
        </div>
      </div>
      <CategoryGrid categories={DEEP_CATEGORIES} />
    </section>
  )
}