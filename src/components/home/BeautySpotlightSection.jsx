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
          <p className="heading-sm">Jewelry Spotlight</p>
          <h2 className="display-md">Style That Shines Every Day</h2>
        </div>
        <Link to="/shop/skincare" className="section-header__link">Explore Jewelry</Link>
      </div>

      <div className="beauty-spotlight">
        <div className="beauty-spotlight__content">
          <p className="beauty-spotlight__ingredient">Lightweight · Trendy · Occasion Ready</p>
          <h3 className="display-md">Statement Pieces for Every Look</h3>
          <p className="body-lg text-muted">
            Discover artificial jewelry designed to elevate festive outfits, daily wear, and gifting moments without losing comfort or style.
          </p>
          <Link to="/shop/skincare">
            <Button variant="secondary">Shop Statement Styles</Button>
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
          <p className="heading-sm">Daily Favorites</p>
          <h3 className="display-md">Elegant pieces, easy styling</h3>
          <p className="body-sm text-muted">From earrings to layered necklaces, find jewelry that works for casual looks, events, and gifting.</p>
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
