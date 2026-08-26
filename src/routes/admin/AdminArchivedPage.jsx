import { useMemo, useState } from 'react'
import { Check, Eye, Package, RotateCcw, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPagination,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { useAdminProductsArchived, useHardDeleteAdminProduct, useRestoreAdminProduct } from '@/features/admin/hooks'
import { ProductViewModal } from '@/routes/admin/AdminProductsPage'

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

function getCategoryName(category) {
  if (!category) return 'Uncategorized'
  if (typeof category === 'string') return category
  return category.name || category.title || category.slug || 'Uncategorized'
}

function getBrandName(brand) {
  if (!brand) return ''
  if (typeof brand === 'string') return brand
  return brand.name || brand.title || ''
}

function formatArchivedDate(product) {
  const raw = product?.archivedAt || product?.deletedAt || null
  if (!raw) return 'Unknown'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function productKey(product) {
  return product?._id || product?.id || product?.slug
}

function matchesSearch(product, term) {
  if (!term) return true
  const hay = [
    product?.name,
    product?.title,
    product?.slug,
    getBrandName(product?.brand),
    getCategoryName(product?.category),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(term)
}

export default function AdminArchivedPage() {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSlugs, setSelectedSlugs] = useState(() => new Set())
  const [viewingProduct, setViewingProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkMode, setBulkMode] = useState(null)
  const [bulkBusy, setBulkBusy] = useState(false)

  const { data, isLoading, isError, error, refetch } = useAdminProductsArchived({ page })
  const restore = useRestoreAdminProduct()
  const hardDelete = useHardDeleteAdminProduct()

  const { items: products, pagination } = useMemo(
    () => extractListPayload(data, ['products']),
    [data]
  )

  const query = searchTerm.trim().toLowerCase()
  const filteredProducts = useMemo(
    () => products.filter((product) => matchesSearch(product, query)),
    [products, query]
  )

  const archivedCount = pagination?.total ?? data?.total ?? products.length
  const visibleSlugs = filteredProducts.map((p) => p.slug).filter(Boolean)
  const allVisibleSelected = visibleSlugs.length > 0 && visibleSlugs.every((slug) => selectedSlugs.has(slug))

  const selectedProducts = products.filter((p) => selectedSlugs.has(p.slug))

  const toggleSelectAll = () => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visibleSlugs.forEach((slug) => next.delete(slug))
      } else {
        visibleSlugs.forEach((slug) => next.add(slug))
      }
      return next
    })
  }

  const toggleSelect = (slug) => {
    if (!slug) return
    setSelectedSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const clearSelection = (slugs) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev)
      slugs.forEach((slug) => next.delete(slug))
      return next
    })
  }

  const handleRestore = async (product) => {
    if (!product?.slug) return
    try {
      await restore.mutateAsync(product.slug)
      clearSelection([product.slug])
      toast.success(`“${product.name || product.title || 'Product'}” restored`)
    } catch (err) {
      toast.error(err?.message || 'Restore failed')
      refetch()
    }
  }

  const confirmDelete = async () => {
    const product = deleteTarget
    if (!product?.slug) return
    try {
      await hardDelete.mutateAsync(product.slug)
      clearSelection([product.slug])
      setDeleteTarget(null)
      toast.success(`“${product.name || product.title || 'Product'}” permanently deleted`)
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
      refetch()
    }
  }

  const confirmBulk = async () => {
    const slugs = [...selectedSlugs]
    if (!slugs.length || !bulkMode) return
    setBulkBusy(true)
    let ok = 0
    let fail = 0
    try {
      for (const slug of slugs) {
        try {
          if (bulkMode === 'restore') await restore.mutateAsync(slug)
          else await hardDelete.mutateAsync(slug)
          ok += 1
        } catch {
          fail += 1
        }
      }
      setSelectedSlugs(new Set())
      setBulkMode(null)
      if (ok && !fail) {
        toast.success(bulkMode === 'restore' ? `${ok} product(s) restored` : `${ok} product(s) permanently deleted`)
      } else if (ok && fail) {
        toast.error(`${ok} succeeded, ${fail} failed`)
        refetch()
      } else {
        toast.error(bulkMode === 'restore' ? 'Bulk restore failed' : 'Bulk delete failed')
        refetch()
      }
    } finally {
      setBulkBusy(false)
    }
  }

  const actionBusy = restore.isPending || hardDelete.isPending || bulkBusy

  return (
    <div className="admin-page admin-archived">
      <header className="admin-products__head">
        <h1 className="admin-products__title">Archived</h1>
      </header>

      <div className="admin-card admin-card--flush admin-products__table-card">
        <div className="admin-archived__toolbar">
          <div className="admin-archived__toolbar-row">
            <div className="admin-archived__heading">
              <h2>Archived Products</h2>
              <span className="admin-archived__count">{archivedCount} archived</span>
            </div>
            <div className="admin-archived__search">
              <Search size={16} aria-hidden />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search archived products..."
                aria-label="Search archived products"
              />
            </div>
          </div>
          {selectedSlugs.size > 0 && (
            <div className="admin-archived__bulk">
              <span className="admin-bulk-bar__badge">
                <Check size={14} aria-hidden />
                {selectedSlugs.size} selected
              </span>
              <button
                type="button"
                className="admin-archived__bulk-btn admin-archived__bulk-btn--restore"
                onClick={() => setBulkMode('restore')}
                disabled={actionBusy}
              >
                <RotateCcw size={15} aria-hidden />
                Restore ({selectedSlugs.size})
              </button>
              <button
                type="button"
                className="admin-archived__bulk-btn admin-archived__bulk-btn--delete"
                onClick={() => setBulkMode('delete')}
                disabled={actionBusy}
              >
                <Trash2 size={15} aria-hidden />
                Permanently Delete ({selectedSlugs.size})
              </button>
            </div>
          )}
        </div>

        {isLoading && <AdminLoading label="Loading archived products…" />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}
        {!isLoading && !isError && filteredProducts.length === 0 && (
          <AdminEmpty
            message={query ? 'No archived products match your search.' : 'No archived products. Products you archive will appear here.'}
          />
        )}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table admin-products-table admin-archived-table">
              <thead>
                <tr>
                  <th className="admin-orders-table__check">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all archived products"
                    />
                  </th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Archived Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const id = productKey(product)
                  const thumb = getProductThumb(product)
                  const brand = getBrandName(product.brand)
                  const isChecked = selectedSlugs.has(product.slug)
                  const rowBusy = actionBusy && (restore.variables === product.slug || hardDelete.variables === product.slug)

                  return (
                    <tr key={id} className={isChecked ? 'is-selected' : undefined}>
                      <td className="admin-orders-table__check">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(product.slug)}
                          aria-label={`Select ${product.name || product.title || 'product'}`}
                        />
                      </td>
                      <td>
                        <div className="admin-product-cell">
                          <ProductThumb src={thumb} alt={product.name || product.title} />
                          <div className="admin-product-cell__text">
                            <strong>{product.name || product.title || '—'}</strong>
                            <span>{product.title && product.title !== product.name ? product.title : (product.slug || '')}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-chip">{getCategoryName(product.category)}</span>
                      </td>
                      <td>
                        {!brand || brand.toLowerCase() === 'generic' ? (
                          <span className="admin-archived__muted">—</span>
                        ) : (
                          brand
                        )}
                      </td>
                      <td>
                        <span className={formatArchivedDate(product) === 'Unknown' ? 'admin-archived__muted' : undefined}>
                          {formatArchivedDate(product)}
                        </span>
                      </td>
                      <td>
                        <div className="admin-products__actions">
                          <button
                            type="button"
                            className="admin-products__action admin-products__action--view"
                            onClick={() => setViewingProduct(product)}
                            aria-label="View"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="admin-products__action admin-products__action--restore"
                            onClick={() => handleRestore(product)}
                            aria-label="Restore"
                            title="Restore Product"
                            disabled={rowBusy || actionBusy}
                          >
                            <RotateCcw size={16} />
                          </button>
                          <button
                            type="button"
                            className="admin-products__action admin-products__action--delete"
                            onClick={() => setDeleteTarget(product)}
                            aria-label="Delete"
                            title="Permanently Delete"
                            disabled={rowBusy || actionBusy}
                          >
                            <Trash2 size={16} />
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
        <AdminPagination
          page={page}
          totalPages={pagination?.totalPages}
          onPageChange={(next) => {
            setPage(next)
            setSelectedSlugs(new Set())
          }}
        />
      </div>

      <ProductViewModal
        open={Boolean(viewingProduct)}
        onOpenChange={(open) => {
          if (!open) setViewingProduct(null)
        }}
        product={viewingProduct}
      />

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        tone="danger"
        title="Permanently delete this product?"
        description={
          deleteTarget
            ? `“${deleteTarget.name || deleteTarget.title}” will be deleted forever. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete forever"
        cancelLabel="Cancel"
        busy={hardDelete.isPending}
        onCancel={() => {
          if (!hardDelete.isPending) setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
      />

      <AdminConfirmDialog
        open={Boolean(bulkMode)}
        tone={bulkMode === 'delete' ? 'danger' : 'warn'}
        title={bulkMode === 'delete' ? `Permanently delete ${selectedSlugs.size} product(s)?` : `Restore ${selectedSlugs.size} product(s)?`}
        description={
          bulkMode === 'delete'
            ? `This cannot be undone. ${selectedProducts.slice(0, 6).map((p) => p.name || p.title).filter(Boolean).join(', ')}${selectedProducts.length > 6 ? '…' : ''}`
            : 'Selected products will return to the Products page and become visible on the storefront.'
        }
        confirmLabel={bulkMode === 'delete' ? 'Delete forever' : 'Restore products'}
        cancelLabel="Cancel"
        busy={bulkBusy}
        onCancel={() => {
          if (!bulkBusy) setBulkMode(null)
        }}
        onConfirm={confirmBulk}
      />
    </div>
  )
}
