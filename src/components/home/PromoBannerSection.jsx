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
          <h2 className="display-md promo-banner__title">
            <span className="heading-accent">Artificial Jewelry</span> for Every Occasion
          </h2>
          <p className="body-lg promo-banner__copy">
            Explore statement earrings, rings, bangles, necklaces, and sets made to complement festive looks and everyday outfits.
          </p>
          <Button variant="accent" asChild>
            <Link to="/shop/women">Shop Jewelry</Link>
          </Button>
          <p className="section-footnote promo-banner__note">
            One edit for every occasion — from daily wear to celebrations and gifting.
          </p>
        </div>
      </div>
    </section>
  )
}
