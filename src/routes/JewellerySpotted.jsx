import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { ScrollRevealText, Reveal } from '@/components/motion/ScrollRevealText'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { ProductCard } from '@/features/product/components/ProductCard'
import { useProductsByTag } from '@/features/product/hooks'
import { Button } from '@/components/ui/Button'

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

export default function JewellerySpotted() {
  const { data, isLoading } = useProductsByTag('jewellery-spotted', { page: 1, limit: 50 })
  const products = data?.products || []

  const bannerImage =
    'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1800&h=800&q=80'

  return (
    <div className="jewellery-spotted-page">
      {/* Hero Banner Section */}
      <section className="soon__hero" style={{ minHeight: '360px' }}>
        <div className="soon__hero-bg">
          <img src={bannerImage} alt="Jewellery Spotted Banner" />
        </div>
        <div className="soon__hero-overlay" />
        <div className="soon__hero-content">
          <p className="soon__eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={14} /> Community Gallery
          </p>
          <h1 className="soon__title">Jewellery Spotted</h1>
          <p className="soon__subtitle">
            Real people, real style. Tag <strong>#FABUNIQO</strong> on Instagram for a chance to be featured in our gallery.
          </p>
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--accent btn--lg"
            >
              Tag #FABUNIQO <InstagramIcon size={16} />
            </a>
            <Button asChild variant="secondary" size="lg">
              <Link to="/shop">Explore All Shop</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="container" style={{ paddingBlock: 'var(--space-6) var(--space-12)' }}>
        {/* Breadcrumbs */}
        <nav className="breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: 'var(--space-4)' }}>
          <Link to="/">Home</Link>
          <span className="breadcrumb__sep">/</span>
          <span className="breadcrumb__current">Jewellery Spotted</span>
        </nav>

        {/* Section Title & Count */}
        <div className="plp-header" style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="display-md">
              Jewellery <span className="heading-accent">Spotted Collection</span>
            </h2>
            <p className="body-sm text-muted" style={{ marginTop: '0.25rem' }}>
              Explore real-world looks and styled customer favorites.
            </p>
          </div>
          <span className="badge badge--neutral" style={{ padding: '0.4rem 0.85rem', fontSize: '0.875rem' }}>
            {products.length} {products.length === 1 ? 'Product' : 'Products'}
          </span>
        </div>

        {/* Product Grid / Loading / Empty */}
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <div className="empty-state" style={{ paddingBlock: '4rem', textAlign: 'center' }}>
            <h2 className="empty-state__title" style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Soon this product will add
            </h2>
            <p className="body-lg text-muted" style={{ marginBottom: '1.5rem', maxWidth: '480px', marginInline: 'auto' }}>
              We are currently updating our Jewellery Spotted gallery. Please check back soon!
            </p>
            <Button asChild variant="primary">
              <Link to="/shop">Browse Store Catalog</Link>
            </Button>
          </div>
        ) : (
          <div className="grid-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
