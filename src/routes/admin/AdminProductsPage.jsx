import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Package, Star } from 'lucide-react'

import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import {
  useAdminProductsActiveCount,
  useAdminProductsAll,
  useAdminProductsLowStock,
} from '@/features/admin/hooks'
import { formatPrice } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function getDiscountPercentage(base, sale) {
  if (!base || !sale || Number(sale) >= Number(base)) return 0
  return Math.round(((Number(base) - Number(sale)) / Number(base)) * 100)
}

function getCategoryName(category) {
  if (!category) return '—'
  if (typeof category === 'string') return category
  return category.name || category.title || category.slug || '—'
}

function getProductThumb(product) {
  const mainVariant = product?.variants?.[0] || {}
  const v0Images = Array.isArray(mainVariant.images) ? mainVariant.images : []
  const main = v0Images.find((img) => img?.isMain) || v0Images[0]
  if (main?.url) return main.url
  const productImages = Array.isArray(product?.images) ? product.images : []
  const first = productImages[0]
  if (typeof first === 'string') return first
  return first?.url || product?.thumbnail || product?.image || null
}

function getProductPricing(product) {
  const mainVariant = product?.variants?.[0] || {}
  const basePrice = toNumber(
    mainVariant.price?.base ?? product?.originalPrice ?? product?.basePrice,
    0
  )
  const saleRaw =
    mainVariant.price?.sale ??
    mainVariant.finalPrice ??
    mainVariant.price?.current ??
    product?.price ??
    product?.salePrice
  const salePrice = saleRaw != null && saleRaw !== '' ? toNumber(saleRaw, null) : null
  const hasSale = salePrice != null && salePrice > 0 && salePrice < basePrice
  const displayPrice = hasSale ? salePrice : (salePrice ?? basePrice)
  const discountPct = hasSale ? getDiscountPercentage(basePrice, salePrice) : 0
  return { basePrice, salePrice: hasSale ? salePrice : null, displayPrice, discountPct }
}

function getEcomStock(product) {
  if (Array.isArray(product?.variants) && product.variants.length) {
    return product.variants.reduce(
      (sum, v) => sum + toNumber(v?.inventory?.quantity ?? v?.availability?.quantity, 0),
      0
    )
  }
  return product?.stock ?? product?.quantity ?? null
}

function getLiveStock(product) {
  if (product?.liveTotalStock != null && Number.isFinite(Number(product.liveTotalStock))) {
    return Number(product.liveTotalStock)
  }
  if (!Array.isArray(product?.variants)) return null
  let sum = 0
  let any = false
  for (const v of product.variants) {
    const live = v?.inventory?.liveQuantity
    if (live == null || !Number.isFinite(Number(live))) continue
    any = true
    sum += Number(live)
  }
  return any ? sum : null
}

function isLowStockProduct(product) {
  if (Array.isArray(product?.variants)) {
    return product.variants.some((v) => {
      const qty = toNumber(v?.inventory?.quantity, Infinity)
      const threshold = toNumber(v?.inventory?.lowStockThreshold, 5)
      return qty < threshold
    })
  }
  return false
}

function getEcomStatus(product) {
  const status = String(product?.channelStatus?.ecomm || product?.status || '').toLowerCase()
  if (product?.isActive === false || status === 'draft' || status === 'archived' || status === 'inactive') {
    return { label: 'Inactive', tone: 'muted' }
  }
  if (status === 'active' || product?.isActive === true || !status) {
    return { label: 'Active', tone: 'success' }
  }
  return { label: status || 'Active', tone: 'muted' }
}

function getWholesaleStatus(product) {
  const status = String(product?.channelStatus?.wholesale || 'draft').toLowerCase()
  return status === 'active'
    ? { label: 'Active', tone: 'success' }
    : { label: 'Inactive', tone: 'muted' }
}

function extractCount(data) {
  if (data == null) return null
  if (typeof data === 'number') return data
  if (typeof data?.total === 'number') return data.total
  if (typeof data?.totalActive === 'number') return data.totalActive
  if (typeof data?.activeCount === 'number') return data.activeCount
  if (typeof data?.count === 'number') return data.count
  if (Array.isArray(data?.products)) return data.products.length
  if (Array.isArray(data?.data)) return data.data.length
  if (Array.isArray(data)) return data.length
  return null
}

function ProductThumb({ src, alt }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken) {
    return (
      <div className="admin-product-thumb admin-product-thumb--empty" aria-hidden>
        <Package size={18} />
      </div>
    )
  }
  return (
    <img
      className="admin-product-thumb"
      src={src}
      alt={alt || ''}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  )
}

export default function AdminProductsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading, isError, error, refetch } = useAdminProductsAll({ page, search })
  const { data: activeData } = useAdminProductsActiveCount()
  const { data: lowStockData } = useAdminProductsLowStock()

  const { items: products, pagination } = useMemo(
    () => extractListPayload(data, ['products']),
    [data]
  )

  const totalProducts = pagination?.total ?? pagination?.totalItems ?? products.length
  const activeCount = extractCount(activeData) ?? products.filter((p) => getEcomStatus(p).label === 'Active').length
  const featuredCount = products.filter((p) => p.isFeatured).length
  const lowStockCount = extractCount(lowStockData) ?? products.filter(isLowStockProduct).length

  const stats = [
    { label: 'Total Products', value: totalProducts, icon: Package, tone: 'blue' },
    { label: 'Active Products (Ecom)', value: activeCount, icon: CheckCircle2, tone: 'green' },
    { label: 'Featured (Ecom)', value: featuredCount, icon: Star, tone: 'amber' },
    { label: 'Low Stock', value: lowStockCount, icon: AlertTriangle, tone: 'red' },
  ]

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Catalog" title="Products" />

      <div className="admin-metric-grid">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`admin-metric-card admin-metric-card--${stat.tone}`}>
              <div>
                <p className="admin-metric-card__label">{stat.label}</p>
                <p className="admin-metric-card__value">{stat.value ?? '—'}</p>
              </div>
              <div className="admin-metric-card__icon" aria-hidden>
                <Icon size={22} />
              </div>
            </div>
          )
        })}
      </div>

      <form
        className="admin-toolbar"
        onSubmit={(e) => {
          e.preventDefault()
          setSearch(searchInput.trim())
          setPage(1)
        }}
      >
        <div className="admin-toolbar__search">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products…"
          />
          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </div>
      </form>

      <div className="admin-card admin-card--flush">
        {isLoading && <AdminLoading label="Loading products…" />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}
        {!isLoading && !isError && products.length === 0 && <AdminEmpty message="No products found." />}
        {!isLoading && products.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table admin-products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price (₹)</th>
                  <th>Ecom Stock</th>
                  <th>Inventory Stock</th>
                  <th>Ecom Status</th>
                  <th>Wholesale Status</th>
                  <th>Featured</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const id = product._id || product.id || product.slug
                  const thumb = getProductThumb(product)
                  const { basePrice, salePrice, displayPrice, discountPct } = getProductPricing(product)
                  const ecomStock = getEcomStock(product)
                  const liveStock = getLiveStock(product)
                  const low = isLowStockProduct(product)
                  const ecom = getEcomStatus(product)
                  const wholesale = getWholesaleStatus(product)

                  return (
                    <tr key={id}>
                      <td>
                        <div className="admin-product-cell">
                          <ProductThumb src={thumb} alt={product.name || product.title} />
                          <div className="admin-product-cell__text">
                            <strong>{product.name || product.title || '—'}</strong>
                            <span>
                              {product.title && product.name
                                ? product.title
                                : (product.sku || product.slug || '')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-chip">{getCategoryName(product.category)}</span>
                      </td>
                      <td>
                        <div className="admin-price-cell">
                          {salePrice != null ? (
                            <>
                              <span className="admin-price-cell__was">{formatPrice(basePrice)}</span>
                              <span className="admin-price-cell__now">{formatPrice(salePrice)}</span>
                              {discountPct > 0 && (
                                <span className="admin-badge admin-badge--success">
                                  {discountPct}% OFF
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="admin-price-cell__now">{formatPrice(displayPrice || 0)}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-stock-cell">
                          <span className={low ? 'admin-stock-cell--low' : ''}>
                            {ecomStock == null ? '—' : ecomStock}
                          </span>
                          {low && <span className="admin-badge admin-badge--error">Low</span>}
                        </div>
                      </td>
                      <td>{liveStock == null ? '—' : liveStock}</td>
                      <td>
                        <span className={`admin-badge${ecom.tone === 'success' ? ' admin-badge--success' : ''}`}>
                          {ecom.label}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge${wholesale.tone === 'success' ? ' admin-badge--success' : ''}`}>
                          {wholesale.label}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge${product.isFeatured ? ' admin-badge--featured' : ''}`}>
                          {product.isFeatured ? '★ Featured' : 'Regular'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination page={page} totalPages={pagination?.totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
