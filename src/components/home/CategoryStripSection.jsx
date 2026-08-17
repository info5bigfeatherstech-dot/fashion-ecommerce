import { Link } from 'react-router-dom'
import { CATEGORY_STRIP } from '@/config/site'

export function CategoryStripSection() {
  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <p className="heading-sm">Shop</p>
          <h2 className="display-md">Browse the House</h2>
        </div>
      </div>
      <div className="category-strip">
        {CATEGORY_STRIP.map((cat) => (
          <Link key={`${cat.slug}-${cat.label}`} to={`/shop/${cat.slug}`} className="category-strip__item">
            <div className="category-strip__icon">
              <img src={cat.image} alt={cat.label} />
            </div>
            <span className="category-strip__label">{cat.label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
