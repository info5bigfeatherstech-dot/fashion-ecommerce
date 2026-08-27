import { Link } from 'react-router-dom'
import { Gift, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SITE_NAME } from '@/config/site'

const DEFAULT_GIFTING_IMAGE =
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1800&h=1000&q=80'

const FEATURES = [
  {
    num: '01',
    title: 'Thoughtful Edits',
    copy: 'Curated gift-ready jewelry for birthdays, festivals, and every special occasion.',
  },
  {
    num: '02',
    title: 'Ready to Wrap',
    copy: 'Beautiful pieces chosen to feel personal — without the last-minute scramble.',
  },
  {
    num: '03',
    title: 'First Access',
    copy: 'Join the list and be first when the FABUNIQO gifting collection goes live.',
  },
]

export function CategoryComingSoon({
  title = 'Gifting',
  image = DEFAULT_GIFTING_IMAGE,
  subtitle = 'A gift edit worth waiting for — elegant pieces chosen for every celebration.',
  exploreHref = '/shop/earrings-studs',
  exploreLabel = 'Explore Earrings & Studs',
}) {
  return (
    <div className="soon soon--gifting">
      <section className="soon__hero" aria-labelledby="soon-heading">
        <div className="soon__hero-frame">
          <div className="soon__hero-bg">
            <img src={image} alt="" />
          </div>
          <div className="soon__hero-overlay" />
          <div className="soon__hero-content">
            <p className="soon__eyebrow">
              <Sparkles size={12} aria-hidden="true" />
              Launching Soon
            </p>
            <p className="soon__brand">{SITE_NAME}</p>
            <h1 id="soon-heading" className="soon__title">{title}</h1>
            <p className="soon__subtitle">{subtitle}</p>
          </div>
        </div>
      </section>

      <section className="container soon__details">
        <div className="soon__intro">
          <Gift className="soon__intro-icon" size={22} aria-hidden="true" />
          <p className="soon__intro-text">
            We’re finishing a gifting collection made for meaningful moments — stay tuned.
          </p>
        </div>

        <div className="soon__grid">
          {FEATURES.map((feature) => (
            <div key={feature.num} className="soon__feature">
              <span className="soon__feature-num">{feature.num}</span>
              <h3 className="soon__feature-title">{feature.title}</h3>
              <p className="body-sm text-muted">{feature.copy}</p>
            </div>
          ))}
        </div>

        <div className="soon__cta-row">
          <Button asChild variant="accent" size="lg">
            <Link to={exploreHref}>{exploreLabel}</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
