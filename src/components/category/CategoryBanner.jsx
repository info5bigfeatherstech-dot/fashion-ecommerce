/**
 * Compact full-width category banner for PLP pages.
 * Same width language as the main hero; shorter height.
 */
export function CategoryBanner({ banner }) {
  if (!banner?.image) return null

  const isGraphic = Boolean(banner.isGraphic || banner.hideText || !banner.title)

  return (
    <section
      className={`plp-banner ${isGraphic ? 'plp-banner--graphic' : ''}`}
      aria-label={banner.title || 'Category banner'}
    >
      <div className="plp-banner__frame">
        <div className="plp-banner__bg">
          <img src={banner.image} alt={banner.alt || banner.title || ''} />
        </div>
        {!isGraphic && <div className="plp-banner__overlay" />}
        {!isGraphic && (
          <div className="plp-banner__content">
            <p className="plp-banner__eyebrow">FABUNIQO</p>
            <h1 className="plp-banner__title">{banner.title}</h1>
            {banner.subtitle ? (
              <p className="plp-banner__subtitle">{banner.subtitle}</p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}
