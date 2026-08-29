import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { JEWELRY_CATEGORIES } from '@/config/site'
import { CATEGORY_BANNERS } from '@/config/categoryBanners'

/** Four trending category tiles — each image opens that shop category. */
const TRENDING_CATEGORY_SLUGS = [
  'earrings-studs',
  'rings',
  'bracelets-bangles',
  'necklace-pendants',
]

const TRENDING_CATEGORIES = TRENDING_CATEGORY_SLUGS.map((slug) => {
  const nav = JEWELRY_CATEGORIES.find((item) => item.slug === slug)
  const banner = CATEGORY_BANNERS[slug]
  return {
    id: slug,
    label: nav?.label || banner?.title || slug,
    href: `/shop/${slug}`,
    image: banner?.image,
    alt: banner?.alt || nav?.label || 'Category',
  }
}).filter((item) => item.image)

export function TrendingNowFastSection() {
  return (
    <section className="section container trending-now-section">
      <div className="section-header">
        <div>
          <Reveal x={-14} y={0}>
            <span className="trending-now-badge">
              <TrendingUp size={14} aria-hidden="true" />
              Trending Jewellery
            </span>
          </Reveal>
          <ScrollRevealText as="h2" className="display-md">
            Moving Fast — Shop Before They’re Gone
          </ScrollRevealText>
          <Reveal delay={0.08}>
            <p className="section-subheader">
              Pieces climbing in popularity right now. Grab the looks everyone’s adding to cart.
            </p>
          </Reveal>
        </div>
        {/* <Reveal delay={0.12}>
          <Link to="/shop/earrings-studs" className="section-header__link">View All</Link>
        </Reveal> */}
      </div>

      <Reveal delay={0.1}>
        <div className="trending-now-videos" role="list">
          {TRENDING_CATEGORIES.map((item) => (
            <div key={item.id} className="trending-now-videos__item" role="listitem">
              <Link
                to={item.href}
                className="trending-now-videos__open"
                aria-label={`Shop ${item.label}`}
              >
                <img
                  src={item.image}
                  alt={item.alt}
                  className="trending-now-videos__video"
                  loading="lazy"
                />
                <span className="trending-now-videos__label">{item.label}</span>
              </Link>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
