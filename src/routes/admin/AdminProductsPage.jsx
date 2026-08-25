import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Archive,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  Package,
  Pencil,
  Plus,
  Search,
  Star,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPagination,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import { AdminBulkUploadModal } from '@/features/admin/components/AdminBulkUploadModal'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { AdminProductModal } from '@/features/admin/components/AdminProductModal'
import { AdminProductStatsBar } from '@/features/admin/components/AdminProductStatsBar'
import { CategoryQuickModal } from '@/features/admin/components/product-form/CategoryQuickModal'
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

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
]

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function getDateRange(preset, startDate, endDate) {
  const now = new Date()
  if (preset === 'today') return { start: startOfDay(now), end: endOfDay(now) }
  if (preset === 'yesterday') {
    const y = new Date(now)
    y.setDate(y.getDate() - 1)
    return { start: startOfDay(y), end: endOfDay(y) }
  }
  if (preset === 'last7days') {
    const s = new Date(now)
    s.setDate(s.getDate() - 6)
    return { start: startOfDay(s), end: endOfDay(now) }
  }
  if (preset === 'last30days') {
    const s = new Date(now)
    s.setDate(s.getDate() - 29)
    return { start: startOfDay(s), end: endOfDay(now) }
  }
  if (preset === 'custom' && startDate && endDate) {
    return { start: startOfDay(startDate), end: endOfDay(endDate) }
  }
  return null
}

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

function isArchivedProduct(product) {
  // Match fabFE: only product.status === 'archived'.
  // Do not use deletedAt / channelStatus here — restored products can still
  // carry leftover fields and would incorrectly stay hidden from the table.
  return String(product?.status || '').toLowerCase() === 'archived'
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

function DateFilterButton({ dateFilter, setDateFilter, startDate, setStartDate, endDate, setEndDate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const isActive = dateFilter !== 'all' && (dateFilter !== 'custom' || (startDate && endDate))

  const label = (() => {
    if (!isActive) return 'Date Filter'
    if (dateFilter === 'custom' && startDate && endDate) return `${startDate} → ${endDate}`
    return DATE_PRESETS.find((p) => p.value === dateFilter)?.label || 'Date Filter'
  })()

  return (
    <div ref={ref} className={`admin-products__date${open ? ' is-open' : ''}${isActive ? ' is-active' : ''}`}>
      <button
        type="button"
        className="admin-products__date-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Calendar size={16} aria-hidden />
        <span>{label}</span>
        {isActive && (
          <span
            className="admin-products__date-clear"
            role="button"
            tabIndex={0}
            aria-label="Clear date filter"
            onClick={(e) => {
              e.stopPropagation()
              setDateFilter('all')
              setStartDate('')
              setEndDate('')
              setOpen(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                setDateFilter('all')
                setStartDate('')
                setEndDate('')
                setOpen(false)
              }
            }}
          >
            <X size={10} aria-hidden />
          </span>
        )}
      </button>
      {open && (
        <div className="admin-products__date-menu">
          <p className="admin-products__date-heading">Quick presets</p>
          {DATE_PRESETS.filter((p) => p.value !== 'custom').map((p) => (
            <button
              key={p.value}
              type="button"
              className={`admin-products__date-option${dateFilter === p.value ? ' is-selected' : ''}`}
              onClick={() => {
                setDateFilter(p.value)
                setStartDate('')
                setEndDate('')
                setOpen(false)
              }}
            >
              {p.label}
              {dateFilter === p.value && <CheckCircle2 size={14} aria-hidden />}
            </button>
          ))}
          <button
            type="button"
            className={`admin-products__date-option${dateFilter === 'custom' ? ' is-selected' : ''}`}
            onClick={() => setDateFilter('custom')}
          >
            Custom range
          </button>
          {dateFilter === 'custom' && (
            <div className="admin-products__date-custom">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-label="Start date" />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-label="End date" />
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  if (!startDate || !endDate) {
                    toast.error('Please select both start and end dates')
                    return
                  }
                  if (new Date(startDate) > new Date(endDate)) {
                    toast.error('Start date cannot be after end date')
                    return
                  }
                  setOpen(false)
                }}
              >
                Apply
              </Button>
            </div>
          )}
        </div>
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
  const [activeVariantIndex, setActiveVariantIndex] = useState(0)
  const productKey = product?._id || product?.id || product?.slug || ''

  useEffect(() => {
    if (open) setActiveVariantIndex(0)
  }, [open, productKey])

  if (!product) return null

  const variants = Array.isArray(product.variants) && product.variants.length
    ? product.variants
    : [{}]
  const activeVariant = variants[Math.min(activeVariantIndex, variants.length - 1)] || variants[0] || {}
  const pricing = getProductPricing(product)
  const low = isLowStockProduct(product)

  const categoryName = getCategoryName(product.category)
  const brand = product.brand || 'Generic'
  const description = product.description || product.shortDescription || '—'
  const created = product.createdAt || product.date_created || null
  const updated = product.updatedAt || product.modifiedAt || product.date_modified || null
  const title = product.title || ''
  const slug = product.slug || product.ProductCode || ''

  const basePrices = variants.map((v) => toNumber(v?.price?.base ?? v?.basePrice ?? v?.price, 0)).filter((n) => n > 0)
  const minBase = basePrices.length ? Math.min(...basePrices) : pricing.basePrice
  const maxBase = basePrices.length ? Math.max(...basePrices) : pricing.basePrice
  const priceRange = minBase === maxBase
    ? `${formatPrice(minBase || 0)}—`
    : `${formatPrice(minBase)} – ${formatPrice(maxBase)}`

  const totalStock = variants.reduce(
    (sum, v) => sum + toNumber(v?.inventory?.quantity ?? v?.availability?.quantity ?? v?.stock ?? 0, 0),
    0
  )

  const shipping = product.shipping || {}
  const dims = shipping.dimensions || {}
  const weight = shipping.weight ?? product.weight ?? activeVariant?.shipping?.weight
  const length = dims.length ?? shipping.length ?? product.length ?? activeVariant?.shipping?.length
  const width = dims.width ?? shipping.width ?? product.width ?? activeVariant?.shipping?.width
  const height = dims.height ?? shipping.height ?? product.height ?? activeVariant?.shipping?.height

  const ecomStatus = getEcomStatus(product)
  const soldInfo = product.soldInfo || product.marketing?.soldInfo
  const fomo = product.fomo || product.marketing?.fomo
  const soldEnabled = Boolean(soldInfo?.enabled ?? soldInfo === true)
  const fomoEnabled = Boolean(fomo?.enabled ?? fomo === true)

  const vBase = toNumber(activeVariant?.price?.base ?? activeVariant?.basePrice ?? activeVariant?.price, 0)
  const vSaleRaw = activeVariant?.price?.sale ?? activeVariant?.finalPrice ?? activeVariant?.price?.current ?? activeVariant?.salePrice
  const vSale = vSaleRaw != null && vSaleRaw !== '' ? toNumber(vSaleRaw, null) : null
  const vHasSale = vSale != null && vSale > 0 && (vBase <= 0 || vSale < vBase)
  const vDiscount = vHasSale && vBase > 0 ? getDiscountPercentage(vBase, vSale) : 0
  const vEcom = toNumber(activeVariant?.inventory?.quantity ?? activeVariant?.availability?.quantity ?? activeVariant?.stock ?? 0, 0)
  const vInv = activeVariant?.inventory?.liveQuantity ?? activeVariant?.inventory?.warehouseQuantity ?? null
  const vLow = toNumber(activeVariant?.inventory?.lowStockThreshold, 5)
  const trackFlag = activeVariant?.inventory?.trackInventory
  const trackedFlag = activeVariant?.inventory?.tracked
  const vTracking = trackFlag != null ? Boolean(trackFlag) : trackedFlag !== false
  const vStatusActive = String(
    activeVariant?.channelStatus?.ecomm
    || activeVariant?.status
    || activeVariant?.availability
    || 'active'
  ).toLowerCase() !== 'inactive' && String(activeVariant?.status || '').toLowerCase() !== 'draft'

  const rawAttrs = activeVariant?.attributes || activeVariant?.options || []
  const attrEntries = Array.isArray(rawAttrs)
    ? rawAttrs
      .map((a) => (typeof a === 'object' ? [a.key || a.name, a.value] : [null, a]))
      .filter(([, val]) => val != null && val !== '')
    : Object.entries(rawAttrs || {}).filter(([, val]) => val != null && val !== '')

  const variantTabLabel = (v, idx) => {
    if (Array.isArray(v?.attributes) && v.attributes.length) {
      const label = v.attributes.map((a) => a.value || a.key).filter(Boolean).join(' / ')
      if (label) return label
    }
    return v?.name || v?.title || `Variant ${idx + 1}`
  }

  const sku = activeVariant?.sku
    || activeVariant?.productCode
    || `SKU-${String(product.ProductCode || product.sku || product.slug || '000000').slice(-7)}-${activeVariantIndex + 1}`

  const variantImages = Array.isArray(activeVariant?.images) ? activeVariant.images : []

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="modal-content--view-product"
      footer={
        <div className="product-view__footer">
          <button type="button" className="product-view__close-btn" onClick={() => onOpenChange(false)}>
            Close
          </button>
        </div>
      }
    >
      <div className="product-view">
        <div className="product-view__identity">
          <div className="product-view__avatar" aria-hidden>
            <Package size={24} />
          </div>
          <div className="product-view__identity-text">
            <h2 className="product-view__name">{product.name || product.title || 'Untitled'}</h2>
            {title && title !== product.name ? (
              <p className="product-view__subtitle">{title}</p>
            ) : null}
            <div className="product-view__badges">
              <span className={`product-view__badge product-view__badge--${ecomStatus.tone}`}>
                {String(ecomStatus.label).toUpperCase()}
              </span>
              {product.isFeatured ? (
                <span className="product-view__badge product-view__badge--featured">
                  <Star size={11} fill="currentColor" aria-hidden /> FEATURED
                </span>
              ) : null}
              {slug ? (
                <span className="product-view__badge product-view__badge--slug">{slug}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="product-view__body">
          <div className="product-view__grid">
            <div className="product-view__card product-view__card--basic">
              <h3 className="product-view__section-title">Basic Information</h3>
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
                <span className="product-view__stat-label">Price Range</span>
                <span className="product-view__stat-value">{priceRange}</span>
              </div>
              <div className={`product-view__stat${low ? ' product-view__stat--low' : ' product-view__stat--ok'}`}>
                <span className="product-view__stat-label">Total Stock</span>
                <span className="product-view__stat-value">
                  {totalStock}
                  {low ? (
                    <span className="product-view__low-flag">
                      <AlertTriangle size={14} aria-hidden /> Low
                    </span>
                  ) : null}
                </span>
              </div>
            </div>
          </div>

          <div className="product-view__card product-view__card--variants">
            <div className="product-view__variants-head">
              <h3 className="product-view__variants-title">Product Variants ({variants.length})</h3>
            </div>

            <div className="product-view__variant-tabs" role="tablist">
              {variants.map((v, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={activeVariantIndex === idx}
                  className={`product-view__variant-tab${activeVariantIndex === idx ? ' is-active' : ''}`}
                  onClick={() => setActiveVariantIndex(idx)}
                >
                  {variantTabLabel(v, idx)}
                </button>
              ))}
            </div>

            <div className="product-view__variant-body">
              <div className="product-view__variant-col">
                <span className="product-view__variant-col-label">Attributes</span>
                {attrEntries.length === 0 ? (
                  <span className="product-view__variant-empty" />
                ) : (
                  <div className="product-view__variant-attrs">
                    {attrEntries.map(([k, val], i) => (
                      <span key={`${k}-${i}`} className="product-view__attr-pill">
                        {k ? `${k}: ${String(val)}` : String(val)}
                      </span>
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
                  <strong className={vHasSale ? 'is-success' : ''}>
                    {vHasSale ? formatPrice(vSale) : '—'}
                  </strong>
                </div>
                <div className="product-view__variant-price-row">
                  <span>Discount:</span>
                  <strong className={vDiscount > 0 ? 'is-success' : ''}>
                    {vDiscount > 0 ? `${vDiscount}% OFF` : '—'}
                  </strong>
                </div>
              </div>

              <div className="product-view__variant-col">
                <span className="product-view__variant-col-label">Inventory</span>
                <div className="product-view__variant-price-row">
                  <span>Ecom stock:</span>
                  <strong className={vEcom < vLow ? 'is-danger' : ''}>{vEcom}</strong>
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
                  <strong className={vTracking ? 'is-success' : 'is-muted'}>
                    {vTracking ? 'Enabled' : 'Disabled'}
                  </strong>
                </div>
                <div className="product-view__variant-price-row">
                  <span>Status:</span>
                  <strong className={vStatusActive ? 'is-success' : 'is-muted'}>
                    {vStatusActive ? 'Active' : 'Inactive'}
                  </strong>
                </div>
              </div>
            </div>

            {variantImages.length > 0 ? (
              <div className="product-view__variant-images">
                <span className="product-view__variant-col-label">Images</span>
                <div className="product-view__image-row">
                  {variantImages.map((img, i) => {
                    const url = typeof img === 'string' ? img : img?.url
                    if (!url) return null
                    return (
                      <div
                        key={i}
                        className={`product-view__image${img?.isMain ? ' is-main' : ''}`}
                      >
                        <img src={url} alt={img?.altText || ''} />
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div className="product-view__variant-sku">
              <span>SKU:</span>
              <code className="product-view__sku">{sku}</code>
            </div>
          </div>

          <div className="product-view__bottom-grid">
            <div className="product-view__card product-view__card--shipping">
              <h3 className="product-view__section-title">Shipping</h3>
              <div className="product-view__info-list">
                <div className="product-view__info-row">
                  <span>Weight:</span>
                  <strong>{weight != null && weight !== '' ? `${weight} kg` : '— kg'}</strong>
                </div>
                <div className="product-view__info-row">
                  <span>Length:</span>
                  <strong>{length != null && length !== '' ? `${length} cm` : '— cm'}</strong>
                </div>
                <div className="product-view__info-row">
                  <span>Width:</span>
                  <strong>{width != null && width !== '' ? `${width} cm` : '— cm'}</strong>
                </div>
                <div className="product-view__info-row">
                  <span>Height:</span>
                  <strong>{height != null && height !== '' ? `${height} cm` : '— cm'}</strong>
                </div>
              </div>
            </div>

            <div className="product-view__card product-view__card--marketing">
              <h3 className="product-view__section-title">Marketing</h3>
              <div className="product-view__info-list">
                <div className="product-view__info-row">
                  <span>Sold Info</span>
                  <span className={`product-view__pill${soldEnabled ? ' is-on' : ''}`}>
                    {soldEnabled
                      ? `${soldInfo?.count ?? soldInfo?.value ?? ''} sold`.trim() || 'Enabled'
                      : 'Disabled'}
                  </span>
                </div>
                <div className="product-view__info-row">
                  <span>FOMO</span>
                  <span className={`product-view__pill${fomoEnabled ? ' is-fomo' : ''}`}>
                    {fomoEnabled
                      ? String(fomo?.type || 'Enabled').replace(/_/g, ' ')
                      : 'Disabled'}
                  </span>
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
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [dateFilter, setDateFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

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
  const { data: categoriesData, refetch: refetchCategories } = useAdminCategories()

  const exportProducts = useExportAdminProducts()
  const archiveProduct = useArchiveAdminProduct()
  const toggleFeatured = useToggleAdminProductFeatured()
  const bulkStatus = useBulkUpdateAdminProductStatus()

  const { items: rawProducts, pagination } = useMemo(
    () => extractListPayload(listData, ['products']),
    [listData]
  )

  const listTotal =
    pagination?.total ??
    pagination?.totalItems ??
    listData?.totalProducts ??
    listData?.total ??
    listData?.data?.totalProducts ??
    listData?.data?.total

  const categories = useMemo(() => {
    const raw = categoriesData?.categories || categoriesData
    return Array.isArray(raw) ? raw : []
  }, [categoriesData])

  const products = useMemo(() => {
    let list = rawProducts
    // Always hide truly archived rows from the main catalog table
    // (archived filter view uses AdminArchivedPage instead).
    if (statusFilter !== 'archived') {
      list = list.filter((p) => !isArchivedProduct(p))
    }
    if (statusFilter !== 'all') {
      list = list.filter((p) => {
        const st = String(p.channelStatus?.ecomm || p.status || '').toLowerCase()
        if (statusFilter === 'active') return st === 'active' || p.isActive === true
        if (statusFilter === 'draft') return st === 'draft' || p.isActive === false
        if (statusFilter === 'archived') return isArchivedProduct(p)
        return true
      })
    }
    if (categoryFilter !== 'all') {
      list = list.filter((p) => getCategoryId(p.category) === categoryFilter)
    }
    const range = getDateRange(dateFilter, startDate, endDate)
    if (range) {
      list = list.filter((p) => {
        const raw = p.createdAt || p.date_created
        if (!raw) return false
        const d = new Date(raw)
        if (Number.isNaN(d.getTime())) return false
        return d >= range.start && d <= range.end
      })
    }
    return list
  }, [rawProducts, statusFilter, categoryFilter, dateFilter, startDate, endDate])

  const totalProducts = listTotal ?? products.length
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

  const handleArchive = (product) => {
    setArchiveTarget({
      slug: product.slug,
      name: product.name || product.title || product.slug || 'this product',
    })
  }

  const confirmArchive = async () => {
    const slug = archiveTarget?.slug
    if (!slug) return
    try {
      await archiveProduct.mutateAsync(slug)
      setSelectedSlugs((prev) => {
        const next = new Set(prev)
        next.delete(slug)
        return next
      })
      setArchiveTarget(null)
      toast.success('Product archived')
    } catch (err) {
      toast.error(err?.message || 'Archive failed')
      listRefetch()
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
    <div className="admin-page admin-products">
      <header className="admin-products__head">
        <h1 className="admin-products__title">Products</h1>
        <AdminProductStatsBar
          activeCount={activeCount}
          featuredCount={featuredCount}
          archivedCount={archivedCount}
          onBulkUpload={() => setShowBulkUpload(true)}
        />
      </header>

      <div className="admin-metric-grid">
        {stats.map((stat) => {
          const Icon = stat.icon
          const className = `admin-metric-card admin-metric-card--${stat.tone}${stat.active ? ' is-active' : ''}`
          const content = (
            <>
              <div>
                <p className="admin-metric-card__label">{stat.label}</p>
                <p className="admin-metric-card__value">{stat.value ?? '—'}</p>
                {stat.active && <p className="admin-metric-card__hint admin-metric-card__hint--danger">Filter active</p>}
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

      <div className="admin-card admin-products__toolbar-card">
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
          <div className="admin-products__toolbar">
            <div className="admin-products__search">
              <Search size={18} aria-hidden />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
              />
            </div>

            <DateFilterButton
              dateFilter={dateFilter}
              setDateFilter={(v) => {
                setDateFilter(v)
                setPage(1)
              }}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
            />

            <select
              className="admin-products__select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              aria-label="Filter by ecom status"
            >
              <option value="all">All Status (Ecom)</option>
              <option value="active">Active</option>
              <option value="draft">Inactive</option>
              <option value="archived">Archived</option>
            </select>

            <div className="admin-products__category-wrap">
              <select
                className="admin-products__select admin-products__select--category"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setPage(1)
                }}
                aria-label="Filter by category"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.name}</option>
                ))}
              </select>
              <button
                type="button"
                className="admin-products__category-add"
                onClick={() => setShowCategoryModal(true)}
                title="Add New Category"
                aria-label="Add new category"
              >
                <Plus size={14} aria-hidden />
              </button>
            </div>

            {showLowStockOnly && (
              <button
                type="button"
                className="admin-products__clear-low"
                onClick={() => setShowLowStockOnly(false)}
              >
                Clear Low Stock Filter
                <X size={14} aria-hidden />
              </button>
            )}

            <button
              type="button"
              className="admin-products__btn-add"
              onClick={() => { setEditingProduct(null); setShowProductModal(true) }}
            >
              <Plus size={18} aria-hidden />
              Add Product
            </button>

            <button
              type="button"
              className="admin-products__btn-export"
              onClick={handleExport}
              disabled={exportProducts.isPending}
            >
              {exportProducts.isPending ? (
                <span className="admin-products__spin" aria-hidden />
              ) : (
                <Download size={18} aria-hidden />
              )}
              {exportProducts.isPending ? 'Exporting…' : 'Export Excel'}
            </button>
          </div>
        )}
      </div>

      <div className="admin-card admin-card--flush admin-products__table-card">
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
                  const isChecked = selectedSlugs.has(product.slug)

                  return (
                    <tr key={id} className={isChecked ? 'is-selected' : undefined}>
                      <td className="admin-orders-table__check">
                        <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(product.slug)} aria-label={`Select ${product.name}`} />
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
                      <td>
                        <span className={`admin-products__status admin-products__status--${ecom.tone}`}>
                          {ecom.label}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-products__status admin-products__status--${wholesale.tone}`}>
                          {wholesale.label}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`admin-products__featured${product.isFeatured ? ' is-featured' : ''}`}
                          onClick={() => handleToggleFeatured(product)}
                        >
                          {product.isFeatured ? (
                            <>
                              <Star size={12} fill="currentColor" aria-hidden />
                              Featured
                            </>
                          ) : (
                            'Regular'
                          )}
                        </button>
                      </td>
                      <td>
                        <div className="admin-products__actions">
                          <button
                            type="button"
                            className="admin-products__action admin-products__action--view"
                            onClick={() => { setViewingProduct(product); setShowViewModal(true) }}
                            aria-label="View"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="admin-products__action admin-products__action--edit"
                            onClick={() => { setEditingProduct(product); setShowProductModal(true) }}
                            aria-label="Edit"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="admin-products__action admin-products__action--archive"
                            onClick={() => handleArchive(product)}
                            aria-label="Archive"
                            title="Archive"
                            disabled={archiveProduct.isPending}
                          >
                            <Archive size={16} />
                          </button>
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
        onCategoriesChange={() => refetchCategories()}
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
      {showCategoryModal && (
        <CategoryQuickModal
          onSelect={(catId) => {
            setCategoryFilter(catId)
            setPage(1)
          }}
          onCreated={() => refetchCategories()}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
      <AdminConfirmDialog
        open={Boolean(archiveTarget)}
        tone="archive"
        title="Archive this product?"
        description={
          archiveTarget
            ? `“${archiveTarget.name}” will be hidden from the storefront and moved to Archived. You can restore it later.`
            : undefined
        }
        confirmLabel="Archive product"
        cancelLabel="Cancel"
        busy={archiveProduct.isPending}
        onCancel={() => {
          if (!archiveProduct.isPending) setArchiveTarget(null)
        }}
        onConfirm={confirmArchive}
      />
    </div>
  )
}
