import { useMemo, useState } from 'react'
import { Clock, Heart, Star } from 'lucide-react'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import { LeadsAutoPushToggle } from '@/features/admin/components/LeadsAutoPushToggle'
import { useAdminPopularWishlistProducts, useAdminWishlists } from '@/features/admin/hooks'

const LIMIT = 10
const DAYS = 7

const TABS = [
  { id: 'all', label: 'All Wishlists', Icon: Heart },
  { id: 'stale', label: 'Stale Wishlists', Icon: Clock },
  { id: 'popular', label: 'Popular Products', Icon: Star },
]

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount ?? 0)

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function wishlistIdOf(row) {
  return row?._id || row?.id
}

function userIdOfWishlist(row) {
  return row?.user?._id || row?.user?.id || row?.userId
}

function extractWishlists(data) {
  if (Array.isArray(data?.data)) {
    return { items: data.data, pagination: data.pagination || {} }
  }
  return extractListPayload(data, ['wishlists', 'data'])
}

function productPills(row) {
  const products = row?.products || row?.items || []
  return products
    .map((p) => p.productName || p.name || p.title)
    .filter(Boolean)
}

export default function AdminWishlistsPage() {
  const [page, setPage] = useState(1)
  const [variant, setVariant] = useState('all')
  const [selectedIds, setSelectedIds] = useState([])

  const allQuery = useAdminWishlists({
    variant: 'all',
    page: variant === 'all' ? page : 1,
    limit: LIMIT,
  })
  const staleQuery = useAdminWishlists({
    variant: 'stale',
    page: variant === 'stale' ? page : 1,
    limit: LIMIT,
    days: DAYS,
  })
  const popularQuery = useAdminPopularWishlistProducts({
    enabled: true,
    limit: 20,
  })

  const activeQuery = variant === 'stale' ? staleQuery : allQuery
  const { data, isLoading, isError, error, refetch } = activeQuery
  const { items: wishlists, pagination } = useMemo(() => extractWishlists(data), [data])
  const allItems = useMemo(() => extractWishlists(allQuery.data).items, [allQuery.data])

  const popularRaw = popularQuery.data
  const popularItems = Array.isArray(popularRaw)
    ? popularRaw
    : (popularRaw?.products || popularRaw?.data || [])

  const totalPages = Math.max(1, Number(pagination?.totalPages) || 1)
  const totalAll = Number(allQuery.data?.pagination?.total ?? extractWishlists(allQuery.data).pagination?.total) || 0
  const totalStale = Number(staleQuery.data?.pagination?.total ?? extractWishlists(staleQuery.data).pagination?.total) || 0
  const avgItems = allItems.length
    ? Math.round(
      allItems.reduce((sum, w) => sum + (Number(w.itemCount ?? w.items?.length) || 0), 0) / allItems.length
    )
    : 0

  const selectableIds = wishlists.map(userIdOfWishlist).filter(Boolean)
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id))

  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? selectableIds : [])
  }

  const toggleSelect = (id) => {
    if (!id) return
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const showList = variant !== 'popular'
  const listLoading = showList && isLoading
  const listError = showList && isError
  const popularLoading = variant === 'popular' && popularQuery.isLoading
  const popularError = variant === 'popular' && popularQuery.isError

  return (
    <div className="admin-page admin-wishlists">
      <AdminPageHeader eyebrow="Leads" title="Wishlists" />

      <div className="admin-wishlists__tabs">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`admin-wishlists__tab${variant === id ? ' is-active' : ''}`}
            onClick={() => {
              setVariant(id)
              setPage(1)
              setSelectedIds([])
            }}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {showList ? (
        <>
          <div className="admin-wishlists__toolbar">
            <LeadsAutoPushToggle />
          </div>

          <div className="admin-wishlists__stats">
            <div className="admin-wishlists__stat admin-wishlists__stat--pink">
              <span>Total Wishlists</span>
              <strong>{totalAll}</strong>
            </div>
            <div className="admin-wishlists__stat admin-wishlists__stat--orange">
              <span>Stale ({DAYS}+ days)</span>
              <strong>{totalStale}</strong>
            </div>
            <div className="admin-wishlists__stat admin-wishlists__stat--purple">
              <span>Avg Items/Wishlist</span>
              <strong>{avgItems}</strong>
            </div>
          </div>

          <div className="admin-card admin-card--flush admin-wishlists__card">
            {listLoading && <AdminLoading label="Loading wishlists…" />}
            {listError && (
              <AdminError message={error?.message || 'Failed to load wishlists'} onRetry={refetch} />
            )}
            {!listLoading && !listError && wishlists.length === 0 && (
              <AdminEmpty message="No wishlists found." />
            )}

            {!listLoading && !listError && wishlists.length > 0 && (
              <div className="admin-table-wrap">
                <table className="admin-table admin-wishlists__table">
                  <thead>
                    <tr>
                      <th className="admin-wishlists__check-col">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          aria-label="Select all wishlists"
                        />
                      </th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Products</th>
                      <th>Created</th>
                      {variant === 'stale' ? <th>Days Stale</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {wishlists.map((row) => {
                      const id = wishlistIdOf(row)
                      const uid = userIdOfWishlist(row)
                      const name = row.user?.name || row.userName || 'Guest User'
                      const email = row.user?.email || row.userEmail || '—'
                      const itemCount = row.itemCount ?? row.items?.length ?? 0
                      const pills = productPills(row)
                      return (
                        <tr key={id}>
                          <td className="admin-wishlists__check-col">
                            {uid ? (
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(uid)}
                                onChange={() => toggleSelect(uid)}
                                aria-label={`Select ${name}`}
                              />
                            ) : null}
                          </td>
                          <td>
                            <div className="admin-wishlists__customer">
                              <strong>{name}</strong>
                              <span>{email}</span>
                            </div>
                          </td>
                          <td>
                            <span className="admin-wishlists__items">{itemCount}</span>
                          </td>
                          <td>
                            <div className="admin-wishlists__pills">
                              {pills.slice(0, 2).map((label) => (
                                <span key={`${id}-${label}`} className="admin-wishlists__pill">
                                  {label.length > 18 ? `${label.slice(0, 18)}…` : label}
                                </span>
                              ))}
                              {itemCount > 2 ? (
                                <span className="admin-wishlists__pill">+{itemCount - 2}</span>
                              ) : null}
                              {pills.length === 0 ? <span className="admin-wishlists__muted">—</span> : null}
                            </div>
                          </td>
                          <td>
                            <div className="admin-wishlists__created">
                              <span>{formatDate(row.createdAt)}</span>
                              <small>{formatTime(row.createdAt)}</small>
                            </div>
                          </td>
                          {variant === 'stale' ? (
                            <td>
                              <span className="admin-wishlists__stale">
                                {row.daysSinceOldestItem != null ? `${row.daysSinceOldestItem} days` : '—'}
                              </span>
                            </td>
                          ) : null}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="admin-wishlists__pager">
              <span>Page {page} of {totalPages}</span>
              <div className="admin-wishlists__pager-btns">
                <button
                  type="button"
                  className="admin-wishlists__pager-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="admin-wishlists__pager-btn admin-wishlists__pager-btn--next"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="admin-wishlists__popular">
          {popularLoading && <AdminLoading label="Loading popular products…" />}
          {popularError && (
            <AdminError
              message={popularQuery.error?.message || 'Failed to load popular products'}
              onRetry={popularQuery.refetch}
            />
          )}
          {!popularLoading && !popularError && popularItems.length === 0 && (
            <AdminEmpty message="No popular wishlist products yet." />
          )}
          {!popularLoading && !popularError && popularItems.length > 0 && (
            <div className="admin-wishlists__popular-grid">
              {popularItems.map((product, index) => {
                const count = product.wishlistCount ?? product.count ?? 0
                const top = popularItems[0]?.wishlistCount ?? popularItems[0]?.count ?? 1
                const width = Math.min(100, (count / (top || 1)) * 100)
                return (
                  <div key={product.productId || product.slug || product.name || index} className="admin-wishlists__popular-card">
                    <span className="admin-wishlists__rank">#{index + 1}</span>
                    <h3>{product.productName || product.name || 'Product'}</h3>
                    {product.price != null ? (
                      <p className="admin-wishlists__price">{formatCurrency(product.price)}</p>
                    ) : null}
                    <div className="admin-wishlists__popular-meta">
                      <span>Wishlisted by</span>
                      <strong>{count} users</strong>
                    </div>
                    <div className="admin-wishlists__bar">
                      <span style={{ width: `${width}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
