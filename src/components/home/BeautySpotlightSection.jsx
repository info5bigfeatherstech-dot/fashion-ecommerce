import { Link } from 'react-router-dom'
import { ProductCard } from '@/features/product/components/ProductCard'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { useBeautyProducts } from '@/features/product/hooks'

export function BeautySpotlightSection() {
  const { data: products, isLoading } = useBeautyProducts()
  const skincare = products?.filter((p) => p.category === 'skincare') || []
  const makeup = products?.filter((p) => p.category === 'makeup') || []

  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <p className="heading-sm">Beauty & Skincare</p>
          <h2 className="display-md">Your Ritual, Our Formula</h2>
        </div>
        <Link to="/shop/skincare" className="section-header__link">Explore Beauty</Link>
      </div>

      <div className="beauty-spotlight">
        <div className="beauty-spotlight__content">
          <p className="beauty-spotlight__ingredient">Clean · Cruelty-Free · Dermatologist Tested</p>
          <h3 className="display-md">Science-Backed Skincare</h3>
          <p className="body-lg text-muted">
            Every formula developed in our own labs. No third-party white labels — just results you can see and feel.
          </p>
          <Link to="/shop/skincare">
            <Button variant="secondary">Shop Skincare</Button>
          </Link>
        </div>
        {isLoading ? (
          <ProductGridSkeleton count={2} />
        ) : (
          <div className="grid-2">
            {skincare.slice(0, 2).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <p className="heading-sm" style={{ marginBottom: 'var(--space-3)' }}>Makeup</p>
        {isLoading ? (
          <ProductGridSkeleton count={2} />
        ) : (
          <div className="grid-2">
            {makeup.slice(0, 2).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
