import { Link } from 'react-router-dom'
import Masonry from 'react-masonry-css'
import { motion } from 'framer-motion'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { ReflectiveCard } from '@/components/ui/ReflectiveCard'
import { AS_SEEN_ON_YOU } from '@/config/site'
import { useBestsellers } from '@/features/product/hooks'

function InstagramIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

const COLLAGE_COLUMNS = {
  default: 3,
  900: 3,
  640: 2,
}

const SIZE_PATTERN = [
  'medium',
  'square',
  'tall',
  'square',
  'medium',
  'square',
  'medium',
  'square',
  'square',
]

const SIZE_CLASS = {
  tall: 'as-seen-collage__item--tall',
  square: 'as-seen-collage__item--square',
  medium: 'as-seen-collage__item--medium',
}

const COLLAGE_IMAGE_LIMIT = 9

function buildCollageItems(products = [], fallback = []) {
  const items = []
  const seen = new Set()

  for (const product of products) {
    const images = (product.images || []).filter(Boolean)
    if (!images.length && product.image) images.push(product.image)
    if (!images.length) continue

    for (const image of images) {
      if (seen.has(image)) continue
      seen.add(image)
      items.push({
        id: `api-${product.id}-${items.length}`,
        image,
        alt: product.name,
        href: `/product/${product.slug}`,
      })
      if (items.length >= COLLAGE_IMAGE_LIMIT) return items
    }
  }

  for (const spot of fallback) {
    if (seen.has(spot.image)) continue
    seen.add(spot.image)
    items.push(spot)
    if (items.length >= COLLAGE_IMAGE_LIMIT) break
  }

  return items
}

function CollageCard({ item, size, index }) {
  return (
    <motion.div
      className="as-seen-collage__motion"
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.05, 0.45),
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <ReflectiveCard
        as={Link}
        to={item.href}
        className={`as-seen-collage__item ${SIZE_CLASS[size]}`}
        maxTilt={6}
        glareOpacity={0.4}
        aria-label={item.alt}
      >
        <img
          src={item.image}
          alt={item.alt}
          className="as-seen-collage__image"
          loading="lazy"
        />
        <span className="as-seen-collage__shine" aria-hidden="true" />
        <span className="as-seen-collage__overlay">
          <InstagramIcon size={14} />
          View look
        </span>
      </ReflectiveCard>
    </motion.div>
  )
}

export function AsSeenOnYouSection() {
  const { data: products = [], isLoading } = useBestsellers()
  const collageItems = buildCollageItems(
    products.slice(0, 48),
    AS_SEEN_ON_YOU.collage || []
  )

  return (
    <section className="section container as-seen-section">
      <div className="section-header as-seen-section__header">
        <div>
          <h2 className="display-md">
            Jewellery <span className="heading-accent">Spotted</span>
          </h2>
          <p className="section-subheader">
            Real people, real style. Tag <strong>#FABUNIQO</strong> for a chance to be featured in our gallery.
          </p>
        </div>
        <a
          href={AS_SEEN_ON_YOU.instagramHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--primary as-seen-section__cta"
        >
          Follow Our Journey
          <InstagramIcon size={16} />
        </a>
      </div>

      {isLoading && collageItems.length === 0 ? (
        <ProductGridSkeleton count={12} />
      ) : collageItems.length > 0 ? (
        <Masonry
          breakpointCols={COLLAGE_COLUMNS}
          className="as-seen-collage"
          columnClassName="as-seen-collage__column"
        >
          {collageItems.map((item, index) => (
            <CollageCard
              key={item.id}
              item={item}
              index={index}
              size={SIZE_PATTERN[index % SIZE_PATTERN.length]}
            />
          ))}
        </Masonry>
      ) : (
        <p className="body-sm text-muted">No gallery images available yet.</p>
      )}

      <p className="section-footnote">
        Share your FABUNIQO looks — we feature our favorites every week.
      </p>
    </section>
  )
}
