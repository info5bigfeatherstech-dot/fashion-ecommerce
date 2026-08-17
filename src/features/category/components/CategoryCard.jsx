import { Link } from 'react-router-dom'

export function CategoryCard({ label, slug, image, imageBack, offer }) {
  return (
    <Link to={`/shop/${slug}`} className="stamp-card">
      <div className="stamp-card__stage">
        <div className="stamp-card__frame">
          <div className="stamp-card__paper">
            <span className="stamp-card__grain" aria-hidden="true" />
          </div>
        </div>

        <div className="stamp-card__cast">
          {imageBack ? (
            <img
              src={imageBack}
              alt=""
              className="stamp-card__figure stamp-card__figure--back"
              loading="lazy"
            />
          ) : null}
          <img
            src={image}
            alt={label}
            className="stamp-card__figure stamp-card__figure--front"
            loading="lazy"
          />
        </div>

        <span className="stamp-card__label">
          <span className="stamp-card__label-text">{label}</span>
        </span>
      </div>

      {offer ? <p className="stamp-card__offer">{offer}</p> : null}
    </Link>
  )
}

export function CategoryGrid({ categories }) {
  return (
    <div className="stamp-row">
      {categories.map((cat) => (
        <CategoryCard key={`${cat.slug}-${cat.label}`} {...cat} />
      ))}
    </div>
  )
}
