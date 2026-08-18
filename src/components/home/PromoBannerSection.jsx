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
          <h2 className="display-md" style={{ marginBottom: 'var(--space-2)' }}><span className="heading-accent">Artificial Jewelry</span> for Every Occasion</h2>
          <p className="body-lg" style={{ opacity: 0.9, marginBottom: 'var(--space-3)' }}>
            Explore statement earrings, rings, bangles, necklaces, and sets made to complement festive looks and everyday outfits.
          </p>
          <Link to="/shop/women">
            <Button variant="accent">Shop Jewelry</Button>
          </Link>
          <p className="section-footnote" style={{ color: 'inherit', opacity: 0.8, marginTop: 'var(--space-3)' }}>
            One edit for every occasion — from daily wear to celebrations and gifting.
          </p>
        </div>
      </div>
    </section>
  )
}
