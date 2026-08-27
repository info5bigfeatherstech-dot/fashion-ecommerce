import { useLayoutEffect, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Heart, Minus, Plus } from 'lucide-react'
import { ProductGallery } from '@/features/product/components/ProductGallery'
import { PriceBlock } from '@/features/product/components/PriceBlock'
import {
  SizeSelector,
  ColorSelector,
  AttributeSelector,
} from '@/features/product/components/SizeSelector'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Accordion } from '@/components/ui/Accordion'
import { ProductCarousel } from '@/features/product/components/ProductCarousel'
import { OutOfStockInquiryForm } from '@/features/product/components/OutOfStockInquiryForm'
import { ProductReviewsSection } from '@/features/reviews/components/ProductReviewsSection'
import { ProductRatingStars } from '@/features/reviews/components/ProductRatingStars'
import { useProductReviews } from '@/features/reviews/hooks'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { useProductDetail, useRelatedProducts } from '@/features/product/hooks'
import { resolveDisplayImages, resolveVariant, isAttrValueInStock } from '@/features/product/mappers'
import { useAppStore } from '@/store'
import { showAddedToCartToast } from '@/lib/cart-toast'
import { scrollToTop } from '@/lib/lenis'
import { formatPrice } from '@/lib/utils'

function formatLabel(value) {
  if (!value) return ''
  return value.replace(/-/g, ' ')
}

function initialAttrsFromProduct(product) {
  const groups = product?.optionGroups || []
  if (!groups.length) return {}
  const preferred =
    product?.variants?.find((variant) => variant?.inStock) ||
    product?.variants?.[0]
  const fromVariant = {}
  for (const attr of preferred?.attributes || []) {
    if (attr?.key && attr?.value != null) fromVariant[attr.key] = attr.value
  }
  const next = {}
  for (const group of groups) {
    // Only seed attrs that variants actually define (optionGroups are variant-only).
    next[group.key] = fromVariant[group.key] ?? group.values[0]
  }
  return next
}

export default function ProductDetail() {
  const { slug } = useParams()
  const { data: product, isLoading, isError } = useProductDetail(slug)
  const { data: reviewData } = useProductReviews(product?.id)
  const reviewSummary = reviewData?.summary ?? null
  const { data: relatedProducts = [] } = useRelatedProducts(slug, {
    limit: 8,
    categorySlug: product?.category,
    enabled: Boolean(slug && product),
  })

  const [selectedAttrs, setSelectedAttrs] = useState({})
  const [quantity, setQuantity] = useState(1)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const gallerySentinelRef = useRef(null)

  const addItem = useAppStore((s) => s.addItem)
  const toggleWishlist = useAppStore((s) => s.toggleWishlist)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const inWishlist = useAppStore((s) => (
    s.isAuthenticated && product ? s.isInWishlist(product.id) : false
  ))
  const navigate = useNavigate()

  useLayoutEffect(() => {
    setSelectedAttrs({})
    setQuantity(1)
    setShowStickyBar(false)
    scrollToTop()
  }, [slug])

  useEffect(() => {
    if (!product) return
    setSelectedAttrs(initialAttrsFromProduct(product))
  }, [product?.id])

  useEffect(() => {
    const target = gallerySentinelRef.current
    if (!target) return undefined

    const media = window.matchMedia('(max-width: 767px)')
    if (!media.matches) {
      setShowStickyBar(false)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -20% 0px' },
    )
    observer.observe(target)

    const onResize = (event) => {
      if (!event.matches) setShowStickyBar(false)
    }
    media.addEventListener('change', onResize)

    return () => {
      observer.disconnect()
      media.removeEventListener('change', onResize)
    }
  }, [slug, product?.id])

  // Product + related content loads async; reset again so we don't land on "You May Also Like"
  useLayoutEffect(() => {
    if (isLoading || !product) return
    scrollToTop()
    const raf = requestAnimationFrame(() => scrollToTop())
    return () => cancelAnimationFrame(raf)
  }, [slug, isLoading, product?.id])

  const selectedVariant = useMemo(() => {
    if (!product) return null
    return resolveVariant(product, { attrs: selectedAttrs })
  }, [product, selectedAttrs])

  const displayTitle = useMemo(() => {
    if (!product) return ''
    const variantTitle = String(selectedVariant?.title || '').trim()
    if (variantTitle) return variantTitle
    return (
      String(product.title || '').trim() ||
      String(product.displayTitle || '').trim() ||
      product.name ||
      'Product'
    )
  }, [product, selectedVariant])

  const displayImages = useMemo(
    () => resolveDisplayImages(product, selectedVariant, selectedAttrs),
    [product, selectedVariant, selectedAttrs]
  )

  const displayPrice = selectedVariant?.price > 0 ? selectedVariant.price : product?.price
  const displayOriginal =
    selectedVariant?.originalPrice > displayPrice
      ? selectedVariant.originalPrice
      : product?.originalPrice
  const displayCode = selectedVariant?.productCode || product?.productCode
  // Prefer selected variant stock; if resolve failed, fall back to any in-stock variant / product flag.
  const isAvailable = selectedVariant
    ? Boolean(selectedVariant.inStock)
    : product?.variants?.length
      ? product.variants.some((variant) => variant.inStock)
      : Boolean(product?.inStock)
  const maxOrderQty = selectedVariant?.quantity > 0
    ? Math.min(8, selectedVariant.quantity)
    : 8

  useEffect(() => {
    setQuantity(1)
  }, [selectedVariant?.id])

  if (isLoading) {
    return (
      <div className="container pdp-page">
        <div className="pdp">
          <div className="skeleton skeleton--image pdp-gallery__main" />
          <div className="pdp-info">
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--text" />
            <div className="skeleton skeleton--text" style={{ width: '40%' }} />
            <ProductGridSkeleton count={2} />
          </div>
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

  const handleAttrSelect = (key, value) => {
    setSelectedAttrs((prev) => {
      const next = { ...prev, [key]: value }
      // Keep the chosen value; align other axes to a matching variant
      // (including out-of-stock ones) so Red OOS stays selected as Red.
      const matched = resolveVariant(product, { attrs: next })
      if (!matched) return next
      for (const attr of matched.attributes || []) {
        if (!attr?.key) continue
        if (String(attr.key).toLowerCase() === String(key).toLowerCase()) {
          next[attr.key] = value
          continue
        }
        next[attr.key] = attr.value
      }
      return next
    })
  }

  const handleAddToCart = async () => {
    if (!isAvailable) return
    if (!isAuthenticated) {
      navigate('/login', { state: { redirectTo: `/product/${slug}` }, replace: true })
      return
    }
    const sizeGroup = (product.optionGroups || []).find((g) => g.isSize)
    const colorGroup = (product.optionGroups || []).find((g) => g.isColor)
    const qty = Math.min(quantity, maxOrderQty)
    const options = {
      size: sizeGroup ? selectedAttrs[sizeGroup.key] : undefined,
      color: colorGroup ? selectedAttrs[colorGroup.key] : undefined,
      attrs: selectedAttrs,
      variantId: selectedVariant?.id,
      quantity: qty,
    }
    const ok = await addItem(product, options)
    if (ok === false) return
    showAddedToCartToast(
      { ...product, name: displayTitle },
      {
        quantity: qty,
        onViewBag: () => navigate('/cart'),
      }
    )
  }

  const handleBuyNow = async () => {
    if (!isAvailable) return
    if (!isAuthenticated) {
      navigate('/login', { state: { redirectTo: `/product/${slug}` }, replace: true })
      return
    }
    const sizeGroup = (product.optionGroups || []).find((g) => g.isSize)
    const colorGroup = (product.optionGroups || []).find((g) => g.isColor)
    const qty = Math.min(quantity, maxOrderQty)
    const ok = await addItem(product, {
      size: sizeGroup ? selectedAttrs[sizeGroup.key] : undefined,
      color: colorGroup ? selectedAttrs[colorGroup.key] : undefined,
      attrs: selectedAttrs,
      variantId: selectedVariant?.id,
      quantity: qty,
    })
    if (ok === false) return
    navigate('/checkout')
  }

  const related = relatedProducts
    .filter((p) => {
      if (!p) return false
      if (product.id != null && p.id != null && String(p.id) === String(product.id)) return false
      if (product.slug && p.slug && String(p.slug) === String(product.slug)) return false
      return true
    })
    .slice(0, 8)
  const optionGroups = product.optionGroups?.length
    ? product.optionGroups
    : [
        ...(product.colors?.length
          ? [{ key: 'Color', label: 'Color', values: product.colors, isColor: true }]
          : []),
        ...(product.sizes?.length
          ? [{ key: 'Size', label: 'Size', values: product.sizes, isSize: true }]
          : []),
      ]

  // Only show pickers when there is more than one choice; single values go into Details.
  const choosableGroups = optionGroups.filter((group) => (group.values?.length || 0) > 1)
  const detailOnlyGroups = optionGroups.filter((group) => (group.values?.length || 0) === 1)

  const detailLines = [
    ...detailOnlyGroups.map((group) => ({
      key: group.key,
      label: group.label || group.key,
      value: group.values[0],
    })),
    ...(product.composition
      ? String(product.composition)
          .split(' · ')
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part) => {
            const idx = part.indexOf(':')
            if (idx === -1) return { key: part, label: part, value: '' }
            return {
              key: part.slice(0, idx).trim(),
              label: part.slice(0, idx).trim(),
              value: part.slice(idx + 1).trim(),
            }
          })
          .filter((row) => !detailOnlyGroups.some((g) => String(g.key).toLowerCase() === String(row.key).toLowerCase()))
      : []),
  ]

  const accordionItems = [
    ...(product.description
      ? [{
          value: 'description',
          title: 'Description',
          content: product.description,
        }]
      : []),
    ...(detailLines.length
      ? [{
          value: 'details',
          title: 'Details',
          content: (
            <dl className="pdp-details-list">
              {detailLines.map((row) => (
                <div key={row.key} className="pdp-details-list__row">
                  <dt>{row.label}</dt>
                  <dd>{row.value || '—'}</dd>
                </div>
              ))}
            </dl>
          ),
        }]
      : []),
  ]

  return (
    <div className="container pdp-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb__sep">/</span>
        <Link to={`/shop/${product.category}`}>{formatLabel(product.category)}</Link>
        {product.subcategory && (
          <>
            <span className="breadcrumb__sep">/</span>
            <Link to={`/shop/${product.category}`}>{formatLabel(product.subcategory)}</Link>
          </>
        )}
        <span className="breadcrumb__sep">/</span>
        <span>{displayTitle}</span>
      </nav>

      <div className="pdp">
        <div ref={gallerySentinelRef}>
          <ProductGallery images={displayImages} name={displayTitle} />
        </div>

        <div className="pdp-info">
          <div className="pdp-info__kicker">
            {product.badge && <Badge badge={product.badge} />}
            <p className="pdp-info__category">
              {formatLabel(product.categoryLabel || product.category)}
              {product.subcategory ? ` · ${formatLabel(product.subcategory)}` : ''}
            </p>
          </div>

          <h1 className="pdp-info__title">{displayTitle}</h1>

          {displayCode && (
            <p className="pdp-info__code">{displayCode}</p>
          )}

          <ProductRatingStars
            product={product}
            reviewSummary={reviewSummary}
            className="pdp-info__rating"
            countClassName="text-muted"
          />

          <PriceBlock price={displayPrice} originalPrice={displayOriginal} size="large" />

          {choosableGroups.map((group) => {
            const selected = selectedAttrs[group.key] ?? group.values[0]
            const outOfStockValues = (group.values || []).filter(
              (value) => !isAttrValueInStock(product, selectedAttrs, group.key, value)
            )
            if (group.isColor) {
              return (
                <ColorSelector
                  key={group.key}
                  label={group.label}
                  colors={group.values}
                  selected={selected}
                  outOfStockValues={outOfStockValues}
                  onSelect={(value) => handleAttrSelect(group.key, value)}
                />
              )
            }
            if (group.isSize) {
              return (
                <SizeSelector
                  key={group.key}
                  label={group.label}
                  sizes={group.values}
                  selected={selected}
                  outOfStockValues={outOfStockValues}
                  onSelect={(value) => handleAttrSelect(group.key, value)}
                />
              )
            }
            return (
              <AttributeSelector
                key={group.key}
                label={group.label}
                values={group.values}
                selected={selected}
                outOfStockValues={outOfStockValues}
                onSelect={(value) => handleAttrSelect(group.key, value)}
              />
            )
          })}

          {!isAvailable ? (
            <div className="pdp-oos">
              <OutOfStockInquiryForm
                productId={product.id}
                variantId={selectedVariant?.id}
                disabled={!product.id || !selectedVariant?.id}
              />
              <div className="pdp-info__actions pdp-info__actions--oos">
                <Button
                  variant="secondary"
                  size="lg"
                  className={`pdp-info__wish${inWishlist ? ' pdp-info__wish--active' : ''}`}
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login', { state: { redirectTo: `/product/${slug}` }, replace: true })
                      return
                    }
                    toggleWishlist(product)
                  }}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="pdp-info__qty">
                <p className="heading-sm">Quantity</p>
                <div className="qty-stepper">
                  <button
                    type="button"
                    className="qty-stepper__btn"
                    onClick={() => setQuantity((n) => Math.max(1, n - 1))}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-stepper__value">{quantity}</span>
                  <button
                    type="button"
                    className="qty-stepper__btn"
                    onClick={() => setQuantity((n) => Math.min(maxOrderQty, n + 1))}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="pdp-info__actions">
                <Button
                  variant="primary"
                  size="lg"
                  className="pdp-info__cta"
                  onClick={handleAddToCart}
                >
                  Add to Bag
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="pdp-info__cta"
                  onClick={handleBuyNow}
                >
                  Buy Now
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className={`pdp-info__wish${inWishlist ? ' pdp-info__wish--active' : ''}`}
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login', { state: { redirectTo: `/product/${slug}` }, replace: true })
                      return
                    }
                    toggleWishlist(product)
                  }}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
                </Button>
              </div>
            </>
          )}

          {accordionItems.length > 0 && (
            <Accordion items={accordionItems} defaultValue="description" />
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="pdp-related">
          <div className="section-header">
            <div>
              <p className="heading-sm">Complete the look</p>
              <h2 className="display-md">You May Also Like</h2>
            </div>
          </div>
          <ProductCarousel products={related} />
        </section>
      )}

      <ProductReviewsSection product={product} />

      <div
        className={`pdp-sticky-bar${showStickyBar ? ' pdp-sticky-bar--visible' : ''}`}
        aria-hidden={!showStickyBar}
      >
        <div className="pdp-sticky-bar__price">
          {formatPrice(displayPrice)}
          {displayOriginal && displayOriginal > displayPrice && (
            <small>{formatPrice(displayOriginal)}</small>
          )}
        </div>
        <Button variant="secondary" size="md" onClick={handleBuyNow} disabled={!isAvailable}>
          Buy Now
        </Button>
        <Button variant="primary" size="md" onClick={handleAddToCart} disabled={!isAvailable}>
          {isAvailable ? 'Add to Bag' : 'Not available'}
        </Button>
      </div>
    </div>
  )
}
