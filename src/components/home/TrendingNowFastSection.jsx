import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { JEWELRY_CATEGORIES } from '@/config/site'
import { CATEGORY_BANNERS } from '@/config/categoryBanners'
import { useCircleCategories } from '@/features/category/hooks'
import { formatCategoryTitle } from '@/lib/utils'
import earringsImg from '@/assets/Earrings.png'
import ringsImg from '@/assets/(7) Silver Tone Floral Pattern Ring for Women with Elegant Design (2).png'
import braceletsImg from '@/assets/(6) Bracelets & Bangles.png'
import necklaceImg from '@/assets/(2) Green Beads Stone Choker Necklace with Earrings Set for Party Wedding Jewellery (1).png'

const CATEGORY_IMAGES = {
  'earrings-studs': earringsImg,
  'rings': ringsImg,
  'bracelets-bangles': braceletsImg,
  'necklace-pendants': necklaceImg,
}

/** Four trending category tiles — each image opens that shop category. */
const TRENDING_CATEGORY_SLUGS = [
  'earrings-studs',
  'rings',
  'bracelets-bangles',
  'necklace-pendants',
]

function isCategoryMatch(c, targetSlug) {
  const target = String(targetSlug || '').toLowerCase().trim()
  const cSlug = String(c?.slug || '').toLowerCase().trim()
  const cName = String(c?.name || c?.label || '').toLowerCase().trim()
  const cId = String(c?.id || c?._id || '').toLowerCase().trim()
  const cHref = String(c?.href || '').toLowerCase().replace(/^\/shop\//, '').trim()

  if (cSlug === target || cName === target || cId === target || cHref === target) return true

  const cleanTarget = target.replace(/[^a-z0-9]/g, '')
  const cleanSlug = cSlug.replace(/[^a-z0-9]/g, '')
  const cleanName = cName.replace(/[^a-z0-9]/g, '')
  const cleanHref = cHref.replace(/[^a-z0-9]/g, '')

  if (cleanTarget && (cleanSlug === cleanTarget || cleanName === cleanTarget || cleanHref === cleanTarget)) {
    return true
  }

  return false
}

export function TrendingNowFastSection() {
  const { data: categories = [] } = useCircleCategories()

  const trendingCategories = useMemo(() => {
    return TRENDING_CATEGORY_SLUGS.map((slug) => {
      const nav = JEWELRY_CATEGORIES.find((item) => item.slug === slug)
      const banner = CATEGORY_BANNERS[slug]

      const matchedCat = categories.find((c) => isCategoryMatch(c, slug))

      const rawCatImage = typeof matchedCat?.image === 'string'
        ? matchedCat.image.trim()
        : (matchedCat?.image?.url || matchedCat?.image?.secure_url || '')

      const image = rawCatImage || CATEGORY_IMAGES[slug] || banner?.image

      const rawLabel = matchedCat?.name || matchedCat?.label || nav?.label || banner?.title || slug
      const label = formatCategoryTitle(rawLabel)

      return {
        id: slug,
        label,
        href: matchedCat?.href || `/shop/${slug}`,
        image,
        alt: banner?.alt || label || 'Category',
      }
    }).filter((item) => item.image)
  }, [categories])

  return (
    <section id="trending-now" className="section container trending-now-section">
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
          {trendingCategories.map((item) => (
            <div key={item.id} className="trending-now-videos__item" role="listitem">
              <Link
                to={item.href}
                state={{ fromSection: 'trending-now' }}
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
