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

      <div className="beauty-makeup">
        <div className="beauty-makeup__intro">
          <p className="heading-sm">Makeup</p>
          <h3 className="display-md">Color, refined</h3>
          <p className="body-sm text-muted">Pigment made in-house. Compact, wearable, and built for everyday.</p>
        </div>
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="beauty-makeup__grid">
            {makeup.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
