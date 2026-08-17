import { Link } from 'react-router-dom'

export function CategoryCard({ label, slug, image }) {
  return (
    <Link to={`/shop/${slug}`} className="category-card">
      <img src={image} alt={label} className="category-card__image" loading="lazy" />
      <div className="category-card__overlay">
        <h3 className="category-card__title">{label}</h3>
      </div>
    </Link>
  )
}

export function CategoryGrid({ categories }) {
  return (
    <div className="grid-3">
      {categories.map((cat) => (
        <CategoryCard key={cat.slug} {...cat} />
      ))}
    </div>
  )
}
