import { Link } from 'react-router-dom'
import { LATEST_COLLECTIONS } from '@/config/site'

export function LatestCollectionsSection() {
  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <h2 className="display-md">Latest <span className="heading-accent">Collections</span></h2>
          <p className="section-subheader">
            Seasonal edits and curated drops — each collection tells a story you can wear from day to night.
          </p>
        </div>
        <Link to="/shop/women" className="section-header__link">All Collections</Link>
      </div>
      <div className="cat-collections">
        {LATEST_COLLECTIONS.map((collection) => (
          <Link
            key={collection.slug}
            to={collection.href}
            className="cat-collection"
          >
            <img src={collection.image} alt="" className="cat-collection__image" loading="lazy" />
            <div className="cat-collection__overlay" />
            <div className="cat-collection__copy">
              <p className="cat-collection__eyebrow">{collection.eyebrow}</p>
              <h3 className="cat-collection__title">{collection.title}</h3>
              <p className="cat-collection__caption">{collection.caption}</p>
            </div>
          </Link>
        ))}
      </div>
      <p className="section-footnote">
        Shop the full edit behind each collection — styled, shoppable, and ready to layer.
      </p>
    </section>
  )
}
