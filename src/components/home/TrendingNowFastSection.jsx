import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { useMovingFastCategories } from '@/features/category/hooks'

export function TrendingNowFastSection() {
  const { data: categories = [], isLoading } = useMovingFastCategories()

  if (!isLoading && categories.length === 0) {
    return null
  }

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
      </div>

      <Reveal delay={0.1}>
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="trending-now-videos" role="list">
            {categories.map((item) => (
              <div key={item.id} className="trending-now-videos__item" role="listitem">
                <Link
                  to={item.href}
                  state={{ fromSection: 'trending-now' }}
                  className="trending-now-videos__open"
                  aria-label={`Shop ${item.label}`}
                >
                  <img
                    src={item.image}
                    alt={item.label}
                    className="trending-now-videos__video"
                    loading="lazy"
                  />
                  <span className="trending-now-videos__label">{item.label}</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Reveal>
    </section>
  )
}
