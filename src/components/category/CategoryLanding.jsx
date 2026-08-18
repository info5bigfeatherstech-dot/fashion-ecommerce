import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function CategoryLanding({ landing }) {
  if (!landing) return null

  const { hero, shops = [], collections = [], spotlights = [] } = landing

  return (
    <div className="cat-landing">
      <section className="cat-hero" aria-label={hero.title}>
        <div className="cat-hero__frame">
          <div className="cat-hero__bg">
            <img src={hero.image} alt={hero.alt} />
          </div>
          <div className="cat-hero__overlay" />
          <div className="cat-hero__content">
            <p className="cat-hero__eyebrow">{hero.eyebrow}</p>
            <p className="cat-hero__brand">{hero.brand}</p>
            <h1 className="cat-hero__title">{hero.title}</h1>
            <p className="cat-hero__subtitle">{hero.subtitle}</p>
            <Button asChild variant="accent" size="lg">
              <Link to={hero.href}>{hero.cta}</Link>
            </Button>
          </div>
        </div>
      </section>

      {shops.length > 0 && (
        <section className="section container" aria-label="Shop by category">
          <div className="cat-shops">
            {shops.map((shop) => (
              <Link key={`${shop.href}-${shop.label}`} to={shop.href} className="cat-shops__item">
                <div className="cat-shops__image">
                  <img src={shop.image} alt="" />
                </div>
                <span className="cat-shops__label">{shop.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {collections.length > 0 && (
        <section className="section container">
          <div className="section-header">
            <div>
              <p className="heading-sm">Curated</p>
              <h2 className="display-md">Featured Collections</h2>
            </div>
          </div>
          <div className="cat-collections">
            {collections.map((collection) => (
              <Link
                key={collection.title}
                to={collection.href}
                className="cat-collection"
              >
                <img src={collection.image} alt="" className="cat-collection__image" />
                <div className="cat-collection__overlay" />
                <div className="cat-collection__copy">
                  <h3 className="cat-collection__title">{collection.title}</h3>
                  <p className="cat-collection__caption">{collection.caption}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {spotlights.map((spotlight) => (
        <section key={spotlight.id} className="section container">
          <Link to={spotlight.href} className="cat-spotlight">
            <div className="cat-spotlight__bg">
              <img src={spotlight.image} alt="" />
            </div>
            <div className="cat-spotlight__overlay" />
            <div className="cat-spotlight__content">
              <p className="cat-hero__eyebrow">{spotlight.eyebrow}</p>
              <h2 className="cat-spotlight__title">{spotlight.title}</h2>
              <p className="cat-spotlight__subtitle">{spotlight.subtitle}</p>
              <span className="btn btn--accent">{spotlight.cta}</span>
            </div>
          </Link>
        </section>
      ))}
    </div>
  )
}
