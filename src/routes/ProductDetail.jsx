import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, Heart } from 'lucide-react'
import { ProductGallery } from '@/features/product/components/ProductGallery'
import { PriceBlock } from '@/features/product/components/PriceBlock'
import { SizeSelector, ColorSelector } from '@/features/product/components/SizeSelector'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Accordion } from '@/components/ui/Accordion'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { useProductDetail, useProductListing } from '@/features/product/hooks'
import { ProductCard } from '@/features/product/components/ProductCard'
import { OfferCode } from '@/features/product/components/OfferCode'
import { useAppStore } from '@/store'

export default function ProductDetail() {
  const { slug } = useParams()
  const { data: product, isLoading, isError } = useProductDetail(slug)
  const { data: relatedData } = useProductListing(
    product ? { category: product.category } : {}
  )

  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)

  const addItem = useAppStore((s) => s.addItem)
  const openCart = useAppStore((s) => s.openCart)
  const toggleWishlist = useAppStore((s) => s.toggleWishlist)
  const inWishlist = useAppStore((s) => product ? s.isInWishlist(product.id) : false)

  if (isLoading) {
    return (
      <div className="container pdp">
        <div className="skeleton skeleton--image" style={{ aspectRatio: '3/4' }} />
        <div>
          <div className="skeleton skeleton--title" style={{ marginBottom: 'var(--space-2)' }} />
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--text" style={{ width: '40%', marginTop: 'var(--space-2)' }} />
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="container empty-state">
        <h1 className="empty-state__title">Product not found</h1>
        <Link to="/"><Button variant="secondary">Back to Home</Button></Link>
      </div>
    )
  }

  const size = selectedSize || product.sizes?.[0]
  const color = selectedColor || product.colors?.[0]

  const handleAddToCart = () => {
    addItem(product, { size, color })
    openCart()
  }

  const accordionItems = [
    {
      value: 'description',
      title: 'Description',
      content: product.description,
    },
    ...(product.ingredients
      ? [{ value: 'ingredients', title: 'Key Ingredients', content: product.ingredients }]
      : []),
    {
      value: 'shipping',
      title: 'Shipping & Returns',
      content: 'Free standard shipping on orders over $100. 30-day hassle-free returns on unworn items with tags attached.',
    },
  ]

  const related = relatedData?.products?.filter((p) => p.id !== product.id).slice(0, 4) || []

  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb__sep">/</span>
        <Link to={`/shop/${product.category}`}>{product.category}</Link>
        <span className="breadcrumb__sep">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="pdp">
        <ProductGallery images={product.images} name={product.name} />

        <div className="pdp-info">
          {product.badge && <Badge badge={product.badge} />}
          <p className="pdp-info__category">{product.category} · {product.subcategory}</p>
          <h1 className="pdp-info__title">{product.name}</h1>

          <div className="product-card__rating">
            <Star size={16} fill="currentColor" />
            <span>{product.rating}</span>
            <span className="text-muted">({product.reviewCount} reviews)</span>
          </div>

          <PriceBlock price={product.price} originalPrice={product.originalPrice} size="large" />
          <OfferCode />

          {product.sizes?.length > 0 && (
            <SizeSelector
              sizes={product.sizes}
              selected={size}
              onSelect={setSelectedSize}
            />
          )}

          {product.colors?.length > 0 && (
            <ColorSelector
              colors={product.colors}
              selected={color}
              onSelect={setSelectedColor}
            />
          )}

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="primary" size="lg" fullWidth onClick={handleAddToCart}>
              Add to Bag
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => toggleWishlist(product)}
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
            </Button>
          </div>

          <Accordion items={accordionItems} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <h2 className="display-md" style={{ marginBottom: 'var(--space-4)' }}>You May Also Like</h2>
          <div className="grid-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
