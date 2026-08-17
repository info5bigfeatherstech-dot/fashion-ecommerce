import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function PromoBannerSection() {
  return (
    <section className="section container">
      <div className="promo-banner">
        <div className="promo-banner__bg">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop"
            alt=""
          />
        </div>
        <div className="promo-banner__overlay" />
        <div className="promo-banner__content">
          <p className="heading-sm" style={{ opacity: 0.85, marginBottom: 'var(--space-1)' }}>Limited Edition</p>
          <h2 className="display-md" style={{ marginBottom: 'var(--space-2)' }}>The Atelier Collection</h2>
          <p className="body-lg" style={{ opacity: 0.9, marginBottom: 'var(--space-3)' }}>
            Hand-finished pieces in limited quantities. Once they're gone, they're gone.
          </p>
          <Link to="/shop/women">
            <Button variant="accent">Shop the Collection</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
