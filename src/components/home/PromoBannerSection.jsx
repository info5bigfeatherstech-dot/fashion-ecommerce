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
          <p className="heading-sm" style={{ opacity: 0.85, marginBottom: 'var(--space-1)' }}>Jewelry Edit</p>
          <h2 className="display-md" style={{ marginBottom: 'var(--space-2)' }}>Artificial Jewelry for Every Occasion</h2>
          <p className="body-lg" style={{ opacity: 0.9, marginBottom: 'var(--space-3)' }}>
            Explore statement earrings, rings, bangles, necklaces, and sets made to complement festive looks and everyday outfits.
          </p>
          <Link to="/shop/women">
            <Button variant="accent">Shop Jewelry</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
