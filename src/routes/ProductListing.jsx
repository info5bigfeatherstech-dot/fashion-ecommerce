import { useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { ProductCard } from '@/features/product/components/ProductCard'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { useProductListing } from '@/features/product/hooks'
import { CATEGORY_TREE } from '@/features/category/api'

const SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
]

const FILTER_CHIPS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'bestseller', label: 'Bestseller' },
  { value: 'limited', label: 'Limited' },
]

export default function ProductListing() {
  const { category } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeBadge, setActiveBadge] = useState(searchParams.get('badge') || '')

  const sort = searchParams.get('sort') || ''
  const search = searchParams.get('q') || ''

  const resolvedCategory = category === 'new-arrivals' ? null : category === 'sale' ? null : category

  const filters = {
    category: resolvedCategory,
    badge: activeBadge || (category === 'new-arrivals' ? 'new' : undefined),
    sort: sort || undefined,
    search: search || undefined,
  }

  const { data, isLoading } = useProductListing(filters)
  const categoryInfo = category ? CATEGORY_TREE[category] : null

  const title = search
    ? `Results for "${search}"`
    : category === 'new-arrivals'
      ? 'New Arrivals'
      : category === 'sale'
        ? 'Sale'
        : categoryInfo?.label || 'All Products'

  const handleSortChange = (e) => {
    const params = new URLSearchParams(searchParams)
    if (e.target.value) {
      params.set('sort', e.target.value)
    } else {
      params.delete('sort')
    }
    setSearchParams(params)
  }

  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb__sep">/</span>
        <span>{title}</span>
      </nav>

      <div className="plp-header">
        <h1 className="display-lg">{title}</h1>
        {categoryInfo && (
          <p className="body-lg text-muted" style={{ marginTop: 'var(--space-1)' }}>
            {categoryInfo.children?.length} subcategories · {data?.total || 0} products
          </p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
        <div className="plp-filters">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value}
              className={`plp-filter-chip ${activeBadge === chip.value ? 'plp-filter-chip--active' : ''}`}
              onClick={() => setActiveBadge(chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <select
          className="input"
          style={{ width: 'auto', minWidth: '180px' }}
          value={sort}
          onChange={handleSortChange}
          aria-label="Sort products"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : data?.products?.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state__title">No products found</h2>
          <p className="body-lg text-muted">Try adjusting your filters or search terms.</p>
          <Link to="/shop/women"><span className="section-header__link">Browse Women</span></Link>
        </div>
      ) : (
        <>
          <p className="body-sm text-muted" style={{ marginBottom: 'var(--space-3)' }}>
            {data?.total} products
          </p>
          <div className="grid-4">
            {data?.products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
