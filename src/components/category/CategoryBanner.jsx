/**
 * Compact full-width category banner for PLP pages.
 * Same width language as the main hero; shorter height.
 */
export function CategoryBanner({ banner }) {
  if (!banner?.image) return null

  return (
    <section className="plp-banner" aria-label={banner.title}>
      <div className="plp-banner__frame">
        <div className="plp-banner__bg">
          <img src={banner.image} alt="" aria-hidden="true" />
        </div>
        <div className="plp-banner__overlay" />
        <div className="plp-banner__content">
          <p className="plp-banner__eyebrow">FABUNIQO</p>
          <h1 className="plp-banner__title">{banner.title}</h1>
          {banner.subtitle ? (
            <p className="plp-banner__subtitle">{banner.subtitle}</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
