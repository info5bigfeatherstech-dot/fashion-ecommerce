import { useMemo, useState } from 'react'
import { Clock, Crosshair, Eye, ShoppingCart } from 'lucide-react'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import { AdminCartDetailsModal } from '@/features/admin/components/AdminCartDetailsModal'
import { LeadsAutoPushToggle } from '@/features/admin/components/LeadsAutoPushToggle'
import { useAdminCarts } from '@/features/admin/hooks'

const LIMIT = 10
const MIN_AMOUNT = 5000
const HOURS = 24

const TABS = [
  { id: 'all', label: 'All Carts', Icon: ShoppingCart },
  { id: 'abandoned', label: 'Abandoned', Icon: Clock },
  { id: 'high-value', label: 'High Value', Icon: Crosshair },
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

function cartIdOf(cart) {
  return cart?._id || cart?.id || cart?.cartId
}

function userIdOfCart(cart) {
  return cart?.user?._id || cart?.user?.id || cart?.userId
}

function extractCarts(data) {
  if (Array.isArray(data?.data)) {
    return { items: data.data, pagination: data.pagination || {} }
  }
  return extractListPayload(data, ['carts', 'data'])
}

export default function AdminCartsPage() {
  const [page, setPage] = useState(1)
  const [variant, setVariant] = useState('all')
  const [selectedIds, setSelectedIds] = useState([])
  const [activeCartId, setActiveCartId] = useState(null)

  const allQuery = useAdminCarts({ variant: 'all', page: variant === 'all' ? page : 1, limit: LIMIT })
  const abandonedQuery = useAdminCarts({
    variant: 'abandoned',
    page: variant === 'abandoned' ? page : 1,
    limit: LIMIT,
    hours: HOURS,
  })
  const highValueQuery = useAdminCarts({
    variant: 'high-value',
    page: variant === 'high-value' ? page : 1,
    limit: LIMIT,
    minAmount: MIN_AMOUNT,
  })

  const activeQuery =
    variant === 'abandoned' ? abandonedQuery
      : variant === 'high-value' ? highValueQuery
        : allQuery

  const { data, isLoading, isError, error, refetch } = activeQuery
  const { items: carts, pagination } = useMemo(() => extractCarts(data), [data])
  const allItems = useMemo(() => extractCarts(allQuery.data).items, [allQuery.data])

  const totalPages = Math.max(1, Number(pagination?.totalPages) || 1)
  const totalAll = Number(allQuery.data?.pagination?.total ?? extractCarts(allQuery.data).pagination?.total) || 0
  const totalAbandoned = Number(abandonedQuery.data?.pagination?.total ?? extractCarts(abandonedQuery.data).pagination?.total) || 0
  const totalHigh = Number(highValueQuery.data?.pagination?.total ?? extractCarts(highValueQuery.data).pagination?.total) || 0
  const avgCartValue = allItems.length
    ? allItems.reduce((sum, cart) => sum + (Number(cart.totalAmount) || 0), 0) / allItems.length
    : 0

  const selectableIds = carts.map(userIdOfCart).filter(Boolean)
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id))

  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? selectableIds : [])
  }

  const toggleSelect = (id) => {
    if (!id) return
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="admin-page admin-carts">
      <AdminPageHeader eyebrow="Leads" title="Carts" />

      <div className="admin-carts__tabs">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`admin-carts__tab${variant === id ? ' is-active' : ''}`}
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

      <div className="admin-carts__toolbar">
        <LeadsAutoPushToggle />
      </div>

      <div className="admin-carts__stats">
        <div className="admin-carts__stat admin-carts__stat--purple">
          <span>Total Carts</span>
          <strong>{totalAll}</strong>
        </div>
        <div className="admin-carts__stat admin-carts__stat--orange">
          <span>Abandoned ({HOURS}h+)</span>
          <strong>{totalAbandoned}</strong>
        </div>
        <div className="admin-carts__stat admin-carts__stat--green">
          <span>High Value (≥₹{MIN_AMOUNT.toLocaleString('en-IN')})</span>
          <strong>{totalHigh}</strong>
        </div>
        <div className="admin-carts__stat admin-carts__stat--blue">
          <span>Avg Cart Value</span>
          <strong>{formatCurrency(avgCartValue)}</strong>
        </div>
      </div>

      <div className="admin-card admin-card--flush admin-carts__card">
        {isLoading && <AdminLoading label="Loading carts…" />}
        {isError && <AdminError message={error?.message || 'Failed to load carts'} onRetry={refetch} />}
        {!isLoading && !isError && carts.length === 0 && <AdminEmpty message="No carts found." />}

        {!isLoading && !isError && carts.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table admin-carts__table">
              <thead>
                <tr>
                  <th className="admin-carts__check-col">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      aria-label="Select all carts"
                    />
                  </th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {carts.map((cart) => {
                  const id = cartIdOf(cart)
                  const uid = userIdOfCart(cart)
                  const name = cart.user?.name || cart.userName || 'Guest User'
                  const email = cart.user?.email || cart.userEmail || '—'
                  const itemCount = cart.itemCount ?? cart.items?.length ?? 0
                  return (
                    <tr
                      key={id}
                      className="admin-carts__row"
                      onClick={() => setActiveCartId(id)}
                    >
                      <td className="admin-carts__check-col" onClick={(e) => e.stopPropagation()}>
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
                        <div className="admin-carts__customer">
                          <strong>{name}</strong>
                          <span>{email}</span>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-carts__items"
                          title="View cart"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveCartId(id)
                          }}
                        >
                          <Eye size={14} aria-hidden="true" />
                          {itemCount}
                        </button>
                      </td>
                      <td>
                        <span className="admin-carts__amount">
                          {formatCurrency(cart.totalAmount ?? cart.subtotal)}
                        </span>
                      </td>
                      <td>
                        <div className="admin-carts__updated">
                          <span>{formatDate(cart.updatedAt)}</span>
                          <small>{formatTime(cart.updatedAt)}</small>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="admin-carts__pager">
          <span>Page {page} of {totalPages}</span>
          <div className="admin-carts__pager-btns">
            <button
              type="button"
              className="admin-carts__pager-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="admin-carts__pager-btn admin-carts__pager-btn--next"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AdminCartDetailsModal
        open={Boolean(activeCartId)}
        onClose={() => setActiveCartId(null)}
        cartId={activeCartId}
      />
    </div>
  )
}
