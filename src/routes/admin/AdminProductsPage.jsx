import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, Download, Eye, Package, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import { AdminBulkUploadModal } from '@/features/admin/components/AdminBulkUploadModal'
import { AdminProductModal } from '@/features/admin/components/AdminProductModal'
import { AdminProductStatsBar } from '@/features/admin/components/AdminProductStatsBar'
import {
  useAdminCategories,
  useAdminProductsActiveCount,
  useAdminProductsAll,
  useAdminProductsArchived,
  useAdminProductsLowStock,
  useArchiveAdminProduct,
  useBulkUpdateAdminProductStatus,
  useExportAdminProducts,
  useToggleAdminProductFeatured,
} from '@/features/admin/hooks'
import { formatPrice } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

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

function getCategoryId(category) {
  if (!category) return ''
  if (typeof category === 'string') return category
  return category._id || category.id || ''
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
  const basePrice = toNumber(mainVariant.price?.base ?? product?.originalPrice ?? product?.basePrice, 0)
  const saleRaw = mainVariant.price?.sale ?? mainVariant.finalPrice ?? mainVariant.price?.current ?? product?.price ?? product?.salePrice
  const salePrice = saleRaw != null && saleRaw !== '' ? toNumber(saleRaw, null) : null
  const hasSale = salePrice != null && salePrice > 0 && salePrice < basePrice
  const displayPrice = hasSale ? salePrice : (salePrice ?? basePrice)
  const discountPct = hasSale ? getDiscountPercentage(basePrice, salePrice) : 0
  return { basePrice, salePrice: hasSale ? salePrice : null, displayPrice, discountPct }
}

function getEcomStock(product) {
  if (Array.isArray(product?.variants) && product.variants.length) {
    return product.variants.reduce((sum, v) => sum + toNumber(v?.inventory?.quantity ?? v?.availability?.quantity, 0), 0)
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
  return status === 'active' ? { label: 'Active', tone: 'success' } : { label: 'Inactive', tone: 'muted' }
}

function extractCount(data) {
  if (data == null) return null
  if (typeof data === 'number') return data
  if (typeof data?.total === 'number') return data.total
  if (typeof data?.activeCount === 'number') return data.activeCount
  if (typeof data?.count === 'number') return data.count
  if (Array.isArray(data?.products)) return data.products.length
  if (Array.isArray(data)) return data.length
  return null
}

function SelectDropdown({ value, onChange, options, placeholder, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])
  const selected = options.find((opt) => opt.value === value)
  return (
    <div ref={ref} className={`custom-select ${className}${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="custom-select__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="custom-select__value">{selected?.label ?? placeholder ?? value}</span>
        <ChevronDown size={16} className="custom-select__caret" aria-hidden />
      </button>
      {open && (
        <ul className="custom-select__menu" role="listbox">
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`custom-select__item${opt.value === value ? ' is-selected' : ''}`}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
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
    <img className="admin-product-thumb" src={src} alt={alt || ''} loading="lazy" onError={() => setBroken(true)} />
  )
}

function fmtDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return String(d)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ProductViewModal({ open, onOpenChange, product }) {
  if (!product) return null
  const v0 = product?.variants?.[0] || {}
  const pricing = getProductPricing(product)
  const ecomStock = getEcomStock(product)
  const low = isLowStockProduct(product)

  const categoryName = getCategoryName(product.category)
  const brand = product.brand || 'Generic'
  const description = product.description || product.shortDescription || '—'
  const created = product.createdAt || product.createdAt || product.date_created || null
  const updated = product.updatedAt || product.modifiedAt || product.date_modified || null

  const variants = Array.isArray(product.variants) ? product.variants : [v0]

  const basePrices = variants.map((v) => toNumber(v?.price?.base ?? v?.basePrice ?? v?.price, 0)).filter((n) => n > 0)
  const minBase = basePrices.length ? Math.min(...basePrices) : pricing.basePrice
  const maxBase = basePrices.length ? Math.max(...basePrices) : pricing.basePrice
  const priceRange = minBase === maxBase ? `${formatPrice(minBase)}—` : `${formatPrice(minBase)} – ${formatPrice(maxBase)}`

  const totalStock = variants.reduce((sum, v) => sum + toNumber(v?.inventory?.quantity ?? v?.availability?.quantity ?? v?.stock ?? 0, 0), 0)

  const shipping = product.shipping || {}
  const weight = shipping.weight ?? product.weight ?? v0.shipping?.weight ?? '—'
  const length = shipping.length ?? product.length ?? v0.shipping?.length ?? '—'
  const width = shipping.width ?? product.width ?? v0.shipping?.width ?? '—'
  const height = shipping.height ?? product.height ?? v0.shipping?.height ?? '—'

  const ecomStatus = getEcomStatus(product)
  const slug = product.slug || product.ProductCode || ''

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="modal-content--view-product"
      footer={
        <div className="product-view__footer">
          <Button type="button" variant="primary" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      }
    >
      <div className="product-view">
        <div className="product-view__header">
          <div className="product-view__identity">
            <div className="product-view__avatar" aria-hidden>
              <Package size={22} />
            </div>
            <div>
              <h2 className="product-view__name">{product.name || product.title || 'Untitled'}</h2>
              <p className="product-view__slug">{slug || 'No slug'}</p>
              <div className="product-view__badges">
                <span className={`admin-badge${ecomStatus.tone === 'success' ? ' admin-badge--success' : ''}`}>
                  {ecomStatus.label}
                </span>
                {slug && (
                  <span className="admin-badge admin-badge--ghost">{slug.length > 20 ? slug.slice(0, 20) + '…' : slug}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="product-view__grid">
          <div className="product-view__card product-view__card--basic">
            <h3 className="product-view__section-title">BASIC INFORMATION</h3>
            <div className="product-view__info-grid">
              <div className="product-view__info-item">
                <span className="product-view__info-label">Category</span>
                <span className="product-view__info-value">{categoryName}</span>
              </div>
              <div className="product-view__info-item">
                <span className="product-view__info-label">Brand</span>
                <span className="product-view__info-value">{brand}</span>
              </div>
              <div className="product-view__info-item">
                <span className="product-view__info-label">Created</span>
                <span className="product-view__info-value">{fmtDate(created)}</span>
              </div>
              <div className="product-view__info-item">
                <span className="product-view__info-label">Updated</span>
                <span className="product-view__info-value">{fmtDate(updated)}</span>
              </div>
              <div className="product-view__info-item product-view__info-item--full">
                <span className="product-view__info-label">Description</span>
                <span className="product-view__info-value product-view__info-value--multiline">{description}</span>
              </div>
            </div>
          </div>

          <div className="product-view__sidebar">
            <div className="product-view__stat product-view__stat--price">
              <span className="product-view__stat-label">PRICE RANGE</span>
              <span className="product-view__stat-value">{priceRange}</span>
            </div>
            <div className={`product-view__stat${low ? ' product-view__stat--low' : ''}`}>
              <span className="product-view__stat-label">TOTAL STOCK</span>
              <span className="product-view__stat-value">
                {totalStock || 0}
                {low && (
                  <span className="admin-badge admin-badge--error" style={{ marginLeft: 8 }}>
                    Low
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="product-view__card product-view__card--variants">
          <h3 className="product-view__section-title product-view__section-title--indigo">
            Product Variants ({variants.length})
          </h3>
          <div className="product-view__variants">
            {variants.map((v, idx) => {
              const vName = v.name || v.title || (variants.length === 1 ? 'Variant 1' : `Variant ${idx + 1}`)
              const vBase = toNumber(v?.price?.base ?? v?.basePrice ?? v?.price, 0)
              const vSaleRaw = v?.price?.sale ?? v?.finalPrice ?? v?.price?.current ?? v?.salePrice
              const vSale = vSaleRaw != null && vSaleRaw !== '' ? toNumber(vSaleRaw, null) : null
              const vHasSale = vSale != null && vSale > 0 && vSale < vBase
              const vDiscount = vHasSale ? getDiscountPercentage(vBase, vSale) : 0
              const vEcom = toNumber(v?.inventory?.quantity ?? v?.availability?.quantity ?? v?.stock ?? 0, 0)
              const vInv = v?.inventory?.warehouseQuantity ?? v?.inventory?.liveQuantity ?? null
              const vLow = toNumber(v?.inventory?.lowStockThreshold, 5)
              const vTracking = v?.inventory?.tracked !== false ? 'Enabled' : 'Disabled'
              const vStatus = String(v?.status || v?.availability || 'active').toLowerCase() === 'inactive' ? 'Inactive' : 'Active'
              const vAttributes = v?.attributes || v?.options || {}
              const attrEntries = Object.entries(vAttributes || {}).filter(([k, val]) => val != null && val !== '')
              const sku = v?.sku || v?.productCode || `SKU-${(product.ProductCode || product.sku || '000000').slice(-6)}-${idx + 1}`

              return (
                <div key={idx} className="product-view__variant">
                  <div className="product-view__variant-header">
                    <div className="product-view__variant-tab">{vName}</div>
                  </div>
                  <div className="product-view__variant-body">
                    <div className="product-view__variant-col">
                      <span className="product-view__variant-col-label">Attributes</span>
                      {attrEntries.length === 0 ? (
                        <span className="product-view__variant-empty">—</span>
                      ) : (
                        <div className="product-view__variant-attrs">
                          {attrEntries.map(([k, val]) => (
                            <div key={k} className="product-view__variant-attr">
                              <strong>{k}:</strong> {String(val)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="product-view__variant-col">
                      <span className="product-view__variant-col-label">Pricing</span>
                      <div className="product-view__variant-price-row">
                        <span>Base Price:</span>
                        <strong>{formatPrice(vBase)}</strong>
                      </div>
                      <div className="product-view__variant-price-row">
                        <span>Sale Price:</span>
                        <strong style={{ color: vHasSale ? 'var(--color-success, #16a34a)' : 'inherit' }}>
                          {vHasSale ? formatPrice(vSale) : '—'}
                        </strong>
                      </div>
                      <div className="product-view__variant-price-row">
                        <span>Discount:</span>
                        <strong style={{ color: 'var(--color-success, #16a34a)' }}>
                          {vDiscount > 0 ? `${vDiscount}% OFF` : '—'}
                        </strong>
                      </div>
                    </div>
                    <div className="product-view__variant-col">
                      <span className="product-view__variant-col-label">Inventory</span>
                      <div className="product-view__variant-price-row">
                        <span>Ecom stock:</span>
                        <strong style={{ color: vEcom < vLow ? 'var(--color-error, #dc2626)' : 'inherit' }}>
                          {vEcom}
                        </strong>
                      </div>
                      <div className="product-view__variant-price-row">
                        <span>Inventory stock:</span>
                        <strong>{vInv == null ? '—' : vInv}</strong>
                      </div>
                      <div className="product-view__variant-price-row">
                        <span>Low Stock At:</span>
                        <strong>{vLow}</strong>
                      </div>
                      <div className="product-view__variant-price-row">
                        <span>Tracking:</span>
                        <strong style={{ color: 'var(--color-success, #16a34a)' }}>{vTracking}</strong>
                      </div>
                      <div className="product-view__variant-price-row">
                        <span>Status:</span>
                        <strong style={{ color: vStatus === 'Active' ? 'var(--color-success, #16a34a)' : 'inherit' }}>
                          {vStatus}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="product-view__variant-sku">
                    SKU: <code className="product-view__sku">{sku}</code>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="product-view__bottom-grid">
          <div className="product-view__card product-view__card--shipping">
            <h3 className="product-view__section-title">SHIPPING</h3>
            <div className="product-view__info-list">
              <div className="product-view__info-row">
                <span>Weight:</span>
                <strong>{weight}{typeof weight === 'number' ? ' kg' : ''}</strong>
              </div>
              <div className="product-view__info-row">
                <span>Length:</span>
                <strong>{length}{typeof length === 'number' ? ' cm' : ''}</strong>
              </div>
              <div className="product-view__info-row">
                <span>Width:</span>
                <strong>{width}{typeof width === 'number' ? ' cm' : ''}</strong>
              </div>
              <div className="product-view__info-row">
                <span>Height:</span>
                <strong>{height}{typeof height === 'number' ? ' cm' : ''}</strong>
              </div>
            </div>
          </div>
          <div className="product-view__card product-view__card--marketing">
            <h3 className="product-view__section-title">MARKETING</h3>
            <div className="product-view__info-list">
              <div className="product-view__info-row product-view__info-row--toggle">
                <span>Featured Product</span>
                <div className={`product-view__toggle${product.isFeatured ? ' is-on' : ''}`} aria-hidden>
                  <div className="product-view__toggle-thumb" />
                </div>
              </div>
              <div className="product-view__info-row product-view__info-row--toggle">
                <span>Sold Info</span>
                <div className={`product-view__toggle${product?.marketing?.soldInfo ? ' is-on' : ''}`} aria-hidden>
                  <div className="product-view__toggle-thumb" />
                </div>
              </div>
              <div className="product-view__info-row product-view__info-row--toggle">
                <span>FOMO</span>
                <div className={`product-view__toggle${product?.marketing?.fomo ? ' is-on' : ''}`} aria-hidden>
                  <div className="product-view__toggle-thumb" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default function AdminProductsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [selectedSlugs, setSelectedSlugs] = useState(new Set())
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingProduct, setViewingProduct] = useState(null)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [dateFilter, setDateFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data, isLoading, isError, error, refetch } = useAdminProductsAll({
    page,
    search,
    limit: 15,
    enabled: !showLowStockOnly,
  })
  const lowStockListQuery = useAdminProductsLowStock({
    page,
    limit: 15,
    enabled: showLowStockOnly,
  })

  const listData = showLowStockOnly ? lowStockListQuery.data : data
  const listLoading = showLowStockOnly ? lowStockListQuery.isLoading : isLoading
  const listError = showLowStockOnly ? lowStockListQuery.isError : isError
  const listErr = showLowStockOnly ? lowStockListQuery.error : error
  const listRefetch = showLowStockOnly ? lowStockListQuery.refetch : refetch
  const { data: activeData } = useAdminProductsActiveCount()
  const { data: lowStockData } = useAdminProductsLowStock()
  const { data: archivedData } = useAdminProductsArchived({ page: 1, limit: 1 })
  const { data: categoriesData } = useAdminCategories()

  const exportProducts = useExportAdminProducts()
  const archiveProduct = useArchiveAdminProduct()
  const toggleFeatured = useToggleAdminProductFeatured()
  const bulkStatus = useBulkUpdateAdminProductStatus()

  const { items: rawProducts, pagination } = useMemo(
    () => extractListPayload(listData, ['products']),
    [listData]
  )

  const categories = useMemo(() => {
    const raw = categoriesData?.categories || categoriesData
    return Array.isArray(raw) ? raw : []
  }, [categoriesData])

  const products = useMemo(() => {
    let list = rawProducts
    if (statusFilter !== 'all') {
      list = list.filter((p) => {
        const st = String(p.channelStatus?.ecomm || p.status || '').toLowerCase()
        if (statusFilter === 'active') return st === 'active' || p.isActive === true
        if (statusFilter === 'draft') return st === 'draft' || p.isActive === false
        if (statusFilter === 'archived') return st === 'archived'
        return true
      })
    }
    if (categoryFilter !== 'all') {
      list = list.filter((p) => getCategoryId(p.category) === categoryFilter)
    }
    return list
  }, [rawProducts, statusFilter, categoryFilter])

  const totalProducts = pagination?.total ?? pagination?.totalItems ?? products.length
  const activeCount = extractCount(activeData) ?? products.filter((p) => getEcomStatus(p).label === 'Active').length
  const featuredCount = products.filter((p) => p.isFeatured).length
  const lowStockCount = extractCount(lowStockData) ?? products.filter(isLowStockProduct).length
  const archivedCount = archivedData?.total ?? archivedData?.pagination?.total ?? extractListPayload(archivedData, ['products']).items.length

  const stats = [
    { label: 'Total Products', value: totalProducts, icon: Package, tone: 'blue' },
    { label: 'Active Products (Ecom)', value: activeCount, icon: CheckCircle2, tone: 'green' },
    { label: 'Featured (Ecom)', value: featuredCount, icon: Star, tone: 'amber' },
    { label: 'Low Stock', value: lowStockCount, icon: AlertTriangle, tone: 'red', onClick: () => setShowLowStockOnly((v) => !v), active: showLowStockOnly },
  ]

  const toggleSelect = (slug) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedSlugs.size === products.length) {
      setSelectedSlugs(new Set())
      return
    }
    setSelectedSlugs(new Set(products.map((p) => p.slug).filter(Boolean)))
  }

  const handleExport = async () => {
    try {
      await exportProducts.mutateAsync()
      toast.success('Products exported')
    } catch (err) {
      toast.error(err?.message || 'Export failed')
    }
  }

  const handleBulkChannel = async (channel, status) => {
    const slugs = [...selectedSlugs]
    if (!slugs.length) return
    try {
      await bulkStatus.mutateAsync({ slugs, channel, status })
      toast.success('Bulk status updated')
      setSelectedSlugs(new Set())
      listRefetch()
    } catch (err) {
      toast.error(err?.message || 'Bulk update failed')
    }
  }

  const handleArchive = async (slug) => {
    if (!window.confirm('Archive this product?')) return
    try {
      await archiveProduct.mutateAsync(slug)
      toast.success('Product archived')
      listRefetch()
    } catch (err) {
      toast.error(err?.message || 'Archive failed')
    }
  }

  const handleToggleFeatured = async (product) => {
    try {
      await toggleFeatured.mutateAsync({ slug: product.slug, isFeatured: !product.isFeatured })
      toast.success(product.isFeatured ? 'Removed from featured' : 'Marked as featured')
      listRefetch()
    } catch (err) {
      toast.error(err?.message || 'Could not update featured status')
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Catalog" title="Products">
        <AdminProductStatsBar
          activeCount={activeCount}
          featuredCount={featuredCount}
          archivedCount={archivedCount}
          onBulkUpload={() => setShowBulkUpload(true)}
        />
      </AdminPageHeader>

      <div className="admin-metric-grid">
        {stats.map((stat) => {
          const Icon = stat.icon
          const className = `admin-metric-card admin-metric-card--${stat.tone}${stat.active ? ' is-active' : ''}`
          const content = (
            <>
              <div>
                <p className="admin-metric-card__label">{stat.label}</p>
                <p className="admin-metric-card__value">{stat.value ?? '—'}</p>
              </div>
              <div className="admin-metric-card__icon" aria-hidden>
                <Icon size={22} />
              </div>
            </>
          )
          if (stat.onClick) {
            return (
              <button
                key={stat.label}
                type="button"
                className={className}
                onClick={stat.onClick}
              >
                {content}
              </button>
            )
          }
          return (
            <div
              key={stat.label}
              className={className}
              role="group"
            >
              {content}
            </div>
          )
        })}
      </div>

      <div className="admin-card admin-toolbar-card">
        {selectedSlugs.size > 0 ? (
          <div className="admin-bulk-bar">
            <span>{selectedSlugs.size} selected</span>
            <div className="admin-row-actions">
              <Button variant="secondary" size="sm" onClick={() => handleBulkChannel('ecomm', 'active')}>Set Ecom Active</Button>
              <Button variant="secondary" size="sm" onClick={() => handleBulkChannel('ecomm', 'draft')}>Set Ecom Inactive</Button>
              <Button variant="secondary" size="sm" onClick={() => handleBulkChannel('wholesale', 'active')}>Set Wholesale Active</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSlugs(new Set())}>Clear</Button>
            </div>
          </div>
        ) : (
          <div className="admin-products-toolbar">
            <form
              className="admin-toolbar__search"
              onSubmit={(e) => {
                e.preventDefault()
                setSearch(searchInput.trim())
                setPage(1)
                setShowLowStockOnly(false)
              }}
            >
              <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search products…" />
              <Button type="submit" variant="secondary" size="sm">Search</Button>
            </form>
            <SelectDropdown
              className="admin-filter-select"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Status (Ecom)' },
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Inactive' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
            <SelectDropdown
              className="admin-filter-select"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map((cat) => ({ value: cat._id || cat.id, label: cat.name })),
              ]}
            />
            <div className="admin-date-filter">
              <SelectDropdown
                value={dateFilter}
                onChange={(v) => {
                  setDateFilter(v)
                  setPage(1)
                }}
                options={[
                  { value: 'all', label: 'All dates' },
                  { value: 'today', label: 'Today' },
                  { value: 'yesterday', label: 'Yesterday' },
                  { value: 'last7days', label: 'Last 7 days' },
                  { value: 'last30days', label: 'Last 30 days' },
                  { value: 'custom', label: 'Custom range' },
                ]}
              />
              {dateFilter === 'custom' && (
                <div className="admin-date-range">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start date"
                    aria-label="Start date"
                  />
                  <span className="admin-date-separator">to</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End date"
                    aria-label="End date"
                  />
                </div>
              )}
            </div>
            <Button variant="primary" size="sm" onClick={() => { setEditingProduct(null); setShowProductModal(true) }}>
              <Plus size={14} /> Add Product
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport} disabled={exportProducts.isPending}>
              <Download size={14} /> {exportProducts.isPending ? 'Exporting…' : 'Export Excel'}
            </Button>
          </div>
        )}
      </div>

      <div className="admin-card admin-card--flush">
        {listLoading && <AdminLoading label="Loading products…" />}
        {listError && <AdminError message={listErr?.message} onRetry={listRefetch} />}
        {!listLoading && !listError && products.length === 0 && (
          <AdminEmpty message={showLowStockOnly ? 'No low stock products.' : 'No products found.'} />
        )}
        {!listLoading && products.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table admin-products-table">
              <thead>
                <tr>
                  <th className="admin-orders-table__check">
                    <input type="checkbox" checked={products.length > 0 && selectedSlugs.size === products.length} onChange={toggleSelectAll} aria-label="Select all" />
                  </th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price (₹)</th>
                  <th>Ecom Stock</th>
                  <th>Inventory Stock</th>
                  <th>Ecom Status</th>
                  <th>Wholesale Status</th>
                  <th>Featured</th>
                  <th>Actions</th>
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
                      <td className="admin-orders-table__check">
                        <input type="checkbox" checked={selectedSlugs.has(product.slug)} onChange={() => toggleSelect(product.slug)} aria-label={`Select ${product.name}`} />
                      </td>
                      <td>
                        <div className="admin-product-cell">
                          <ProductThumb src={thumb} alt={product.name || product.title} />
                          <div className="admin-product-cell__text">
                            <strong>{product.name || product.title || '—'}</strong>
                            <span>{product.title && product.name ? product.title : (product.sku || product.slug || '')}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="admin-chip">{getCategoryName(product.category)}</span></td>
                      <td>
                        <div className="admin-price-cell">
                          {salePrice != null ? (
                            <>
                              <span className="admin-price-cell__was">{formatPrice(basePrice)}</span>
                              <span className="admin-price-cell__now">{formatPrice(salePrice)}</span>
                              {discountPct > 0 && <span className="admin-badge admin-badge--success">{discountPct}% OFF</span>}
                            </>
                          ) : (
                            <span className="admin-price-cell__now">{formatPrice(displayPrice || 0)}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-stock-cell">
                          <span className={low ? 'admin-stock-cell--low' : ''}>{ecomStock == null ? '—' : ecomStock}</span>
                          {low && <span className="admin-badge admin-badge--error">Low</span>}
                        </div>
                      </td>
                      <td>{liveStock == null ? '—' : liveStock}</td>
                      <td><span className={`admin-badge${ecom.tone === 'success' ? ' admin-badge--success' : ''}`}>{ecom.label}</span></td>
                      <td><span className={`admin-badge${wholesale.tone === 'success' ? ' admin-badge--success' : ''}`}>{wholesale.label}</span></td>
                      <td>
                        <button type="button" className={`admin-badge admin-badge--btn${product.isFeatured ? ' admin-badge--featured' : ''}`} onClick={() => handleToggleFeatured(product)}>
                          {product.isFeatured ? '★ Featured' : 'Regular'}
                        </button>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <Button variant="ghost" size="sm" onClick={() => { setViewingProduct(product); setShowViewModal(true) }} aria-label="View">
                            <Eye size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setEditingProduct(product); setShowProductModal(true) }} aria-label="Edit">
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleArchive(product.slug)} aria-label="Archive">
                            <Trash2 size={14} />
                          </Button>
                        </div>
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

      <AdminProductModal
        open={showProductModal}
        onOpenChange={setShowProductModal}
        product={editingProduct}
        categories={categories}
        products={rawProducts}
        onSaved={() => listRefetch()}
      />
      <ProductViewModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        product={viewingProduct}
      />
      <AdminBulkUploadModal
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onComplete={() => listRefetch()}
      />
    </div>
  )
}
