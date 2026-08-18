import { Link } from 'react-router-dom'
import { EDITORIAL_GUIDES } from '@/config/site'

export function EditorialSection() {
  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <h2 className="display-md">Curated <span className="heading-accent">Styling Inspiration</span></h2>
          <p className="section-subheader">
            Lookbooks and styling notes to help you layer, gift, and wear every piece with ease.
          </p>
        </div>
        <Link to="/shop" className="section-header__link">Shop the Looks</Link>
      </div>
      <div className="grid-3">
        {EDITORIAL_GUIDES.map((guide) => (
          <Link key={guide.slug} to={`/shop/${guide.slug}`} className="editorial-card">
            <img src={guide.image} alt={guide.title} className="editorial-card__image" loading="lazy" />
            <div className="editorial-card__body">
              <p className="editorial-card__tag">{guide.tag}</p>
              <h3 className="editorial-card__title">{guide.title}</h3>
              <p className="body-sm text-muted">{guide.description}</p>
            </div>
          </Link>
        ))}
      </div>
      <p className="section-footnote">
        Explore each story for outfit ideas and shoppable jewelry edits.
      </p>
    </section>
  )
}
