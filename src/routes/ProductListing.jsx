import { useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { ProductCard } from '@/features/product/components/ProductCard'
import { ProductFilters } from '@/features/product/components/ProductFilters'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useProductListing } from '@/features/product/hooks'
import { PRICE_RANGES } from '@/features/product/api'
import { CATEGORY_TREE } from '@/features/category/api'
import { getCategoryLanding } from '@/config/categoryLandings'
import { CategoryLanding } from '@/components/category/CategoryLanding'

const SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
]

export default function ProductListing() {
  const { category, subcategory } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const sort = searchParams.get('sort') || ''
  const search = searchParams.get('q') || ''
  const badge = searchParams.get('badge') || ''
  const priceKey = searchParams.get('price') || 'all'
  const size = searchParams.get('size') || ''
  const color = searchParams.get('color') || ''
  const onSale = searchParams.get('sale') === '1'

  const specials = ['new-arrivals', 'sale']
  const resolvedCategory = specials.includes(category) ? category : category
  const categoryInfo = CATEGORY_TREE[category] || null
  const landing = !subcategory && !search ? getCategoryLanding(category) : null
  const priceRange = PRICE_RANGES.find((range) => range.key === priceKey)

  const isSoonCollection =
    (!subcategory && !search && (category === 'men' || category === 'kids'))

  const filters = {
    category: resolvedCategory || undefined,
    subcategory: subcategory || undefined,
    badge: badge || undefined,
    minPrice: priceRange?.min,
    maxPrice: priceRange?.max,
    size: size || undefined,
    color: color || undefined,
    onSale: onSale || undefined,
    sort: sort || undefined,
    search: search || undefined,
  }

  const { data, isLoading } = useProductListing(filters)

  const title = search
    ? `Results for "${search}"`
    : subcategory
      ? categoryInfo?.children?.find((child) => child.slug === subcategory)?.label || subcategory
      : category === 'new-arrivals'
        ? 'New Arrivals'
        : category === 'sale'
          ? 'Sale'
          : categoryInfo?.label || 'All Products'

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    setSearchParams(params)
  }

  const clearFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (sort) params.set('sort', sort)
    setSearchParams(params)
  }

  const filterProps = {
    category,
    subcategory,
    categoryInfo,
    priceKey,
    badge,
    size,
    color,
    onSale,
    onPriceChange: (key) => updateParam('price', key === 'all' ? '' : key),
    onBadgeChange: (value) => updateParam('badge', value),
    onSizeChange: (value) => updateParam('size', value),
    onColorChange: (value) => updateParam('color', value),
    onSaleChange: (checked) => updateParam('sale', checked ? '1' : ''),
    onClear: clearFilters,
  }

  if (isSoonCollection) {
    const isMen = category === 'men'
    const soonLabel = categoryInfo?.label || category
    const soonImage = isMen
      ? 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1800&h=1000&q=80'
      : 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1800&h=1000&q=80'

    return (
      <div className="soon">
        <section className="soon__hero">
          <div className="soon__hero-bg">
            <img src={soonImage} alt="" />
          </div>
          <div className="soon__hero-overlay" />
          <div className="soon__hero-content">
            <p className="soon__eyebrow">Coming Soon</p>
            <h1 className="soon__title">{soonLabel}</h1>
            <p className="soon__subtitle">
              We're crafting something special. The {soonLabel.toLowerCase()} collection
              is being designed with the same care and attention you expect from VERAÒ.
            </p>
            <div className="soon__notify">
              <input
                type="email"
                className="soon__input"
                placeholder="Enter your email to get notified"
                aria-label="Email for notification"
              />
              <Button variant="accent" size="lg">Notify Me</Button>
            </div>
          </div>
        </section>

        <section className="container soon__details">
          <div className="soon__grid">
            <div className="soon__feature">
              <span className="soon__feature-num">01</span>
              <h3 className="soon__feature-title">Curated Selection</h3>
              <p className="body-sm text-muted">
                Hand-picked pieces that blend timeless design with modern craftsmanship.
              </p>
            </div>
            <div className="soon__feature">
              <span className="soon__feature-num">02</span>
              <h3 className="soon__feature-title">Premium Quality</h3>
              <p className="body-sm text-muted">
                Every item made in-house — no third-party labels, no compromises.
              </p>
            </div>
            <div className="soon__feature">
              <span className="soon__feature-num">03</span>
              <h3 className="soon__feature-title">Exclusive Drops</h3>
              <p className="body-sm text-muted">
                Limited quantities, numbered pieces. Be the first to shop the collection.
              </p>
            </div>
          </div>

          <div className="soon__cta-row">
            <Button asChild variant="accent" size="lg">
              <Link to="/shop/women">Explore Women's Collection</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={landing ? 'plp-page' : 'container'}>
      {landing && <CategoryLanding landing={landing} />}
      <div className={landing ? 'container' : undefined}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb__sep">/</span>
        {subcategory && categoryInfo ? (
          <>
            <Link to={`/shop/${category}`}>{categoryInfo.label}</Link>
            <span className="breadcrumb__sep">/</span>
            <span>{title}</span>
          </>
        ) : (
          <span>{title}</span>
        )}
      </nav>

      <div className="plp-header">
        {landing ? (
          <h2 className="display-lg">Shop All {title}</h2>
        ) : (
          <h1 className="display-lg">{title}</h1>
        )}
        <p className="body-lg text-muted" style={{ marginTop: 'var(--space-1)' }}>
          {data?.total || 0} products
        </p>
      </div>

      <div className="plp-toolbar">
        <Button
          variant="secondary"
          size="sm"
          className="plp-toolbar__toggle"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal size={16} />
          Filters
        </Button>
        <Select
          value={sort || 'featured'}
          onValueChange={(value) => updateParam('sort', value === 'featured' ? '' : value)}
        >
          <SelectTrigger className="plp-sort" aria-label="Sort products">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value || 'featured'} value={opt.value || 'featured'}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="plp-layout">
        <div className={`plp-sidebar-shell ${filtersOpen ? 'plp-sidebar-shell--open' : ''}`}>
          <div className="plp-sidebar-overlay" onClick={() => setFiltersOpen(false)} />
          <div className="plp-sidebar-panel">
            <div className="plp-sidebar__mobile-head">
              <p className="plp-sidebar__title">Filters</p>
              <button
                type="button"
                className="btn btn--ghost btn--icon"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>
            <ProductFilters {...filterProps} />
            <div className="plp-sidebar__mobile-foot">
              <Button variant="primary" fullWidth onClick={() => setFiltersOpen(false)}>
                Show {data?.total || 0} products
              </Button>
            </div>
          </div>
        </div>

        <div className="plp-main">
          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : data?.products?.length === 0 ? (
            <div className="empty-state">
              <h2 className="empty-state__title">No products found</h2>
              <p className="body-lg text-muted">Try adjusting your filters or search terms.</p>
              <button type="button" className="section-header__link" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid-4">
              {data?.products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
