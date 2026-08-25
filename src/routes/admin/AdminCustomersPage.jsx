import { useEffect, useMemo, useState } from 'react'
import { Download, Heart, Search, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import { AdminCartDetailsModal } from '@/features/admin/components/AdminCartDetailsModal'
import { AdminCustomerDetailsModal } from '@/features/admin/components/AdminCustomerDetailsModal'
import { LeadsAutoPushToggle } from '@/features/admin/components/LeadsAutoPushToggle'
import {
  useAdminUsers,
  useExportAdminUsers,
} from '@/features/admin/hooks'

function formatJoinedDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatJoinedTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function userIdOf(user) {
  return user?._id || user?.id
}

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [cartUser, setCartUser] = useState(null)
  const [detailUser, setDetailUser] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminUsers({
    page,
    limit: 10,
    search,
    role,
  })
  const exportUsers = useExportAdminUsers()

  const { items: users, pagination } = useMemo(() => {
    if (Array.isArray(data?.data)) {
      return { items: data.data, pagination: data.pagination || {} }
    }
    return extractListPayload(data, ['users', 'data'])
  }, [data])

  const totalPages = Math.max(1, Number(pagination?.totalPages) || 1)
  const allSelected = users.length > 0 && users.every((u) => selectedIds.includes(userIdOf(u)))

  const handleSelectAll = (checked) => {
    if (checked) setSelectedIds(users.map(userIdOf).filter(Boolean))
    else setSelectedIds([])
  }

  const toggleUser = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleExport = async () => {
    try {
      await exportUsers.mutateAsync({ search, role })
      toast.success('Customers exported')
    } catch (err) {
      toast.error(err?.message || 'Export failed')
    }
  }

  return (
    <div className="admin-page admin-leads">
      <AdminPageHeader title="Leads" />

      <div className="admin-leads__toolbar">
        <div className="admin-leads__search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search customers..."
            aria-label="Search customers"
          />
        </div>

        <LeadsAutoPushToggle />

        <select
          className="admin-leads__role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by role"
        >
          <option value="">All Roles</option>
          <option value="user">Customer</option>
          <option value="wholesaler">Wholesaler</option>
        </select>

        <button
          type="button"
          className="admin-leads__export"
          onClick={handleExport}
          disabled={exportUsers.isPending}
        >
          {exportUsers.isPending ? (
            <span className="admin-leads__export-spin" aria-hidden="true" />
          ) : (
            <Download size={16} aria-hidden="true" />
          )}
          {exportUsers.isPending ? 'Exporting…' : 'Export Data'}
        </button>
      </div>

      <div className="admin-card admin-card--flush admin-leads__card">
        {isFetching && !isLoading ? (
          <div className="admin-leads__updating" aria-busy="true">Updating…</div>
        ) : null}

        {isLoading && <AdminLoading label="Loading customers…" />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}
        {!isLoading && !isError && users.length === 0 && (
          <AdminEmpty message="No customers found." />
        )}

        {!isLoading && !isError && users.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table admin-leads__table">
              <thead>
                <tr>
                  <th className="admin-leads__check-col">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      aria-label="Select all customers"
                    />
                  </th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Engagement</th>
                  <th>Joined</th>
                  <th className="admin-leads__actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const id = userIdOf(user)
                  const initial = (user.name || user.email || '?').charAt(0).toUpperCase()
                  const verified = Boolean(user.isVerified)
                  return (
                    <tr key={id}>
                      <td className="admin-leads__check-col">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(id)}
                          onChange={() => toggleUser(id)}
                          aria-label={`Select ${user.name || user.email || 'customer'}`}
                        />
                      </td>
                      <td>
                        <div className="admin-leads__customer">
                          <span className="admin-leads__avatar" aria-hidden="true">{initial}</span>
                          <div className="admin-leads__customer-meta">
                            <strong>{user.name || 'Customer'}</strong>
                            <span>{user.email || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-leads__status${verified ? ' is-verified' : ''}`}>
                          {verified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-leads__engage">
                          <button
                            type="button"
                            className="admin-leads__engage-chip admin-leads__engage-chip--cart"
                            title="View cart items"
                            onClick={() => setCartUser(user)}
                          >
                            <ShoppingBag size={12} aria-hidden="true" />
                            {user.cartItemsCount || 0}
                          </button>
                          <button
                            type="button"
                            className="admin-leads__engage-chip admin-leads__engage-chip--wish"
                            title="View customer details"
                            onClick={() => setDetailUser(user)}
                          >
                            <Heart size={12} aria-hidden="true" />
                            {user.wishlistCount || 0}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="admin-leads__joined">
                          <span>{formatJoinedDate(user.createdAt)}</span>
                          <small>{formatJoinedTime(user.createdAt)}</small>
                        </div>
                      </td>
                      <td className="admin-leads__actions-col" />
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="admin-leads__pager">
          <span>Page {page} of {totalPages}</span>
          <div className="admin-leads__pager-btns">
            <button
              type="button"
              className="admin-leads__pager-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="admin-leads__pager-btn admin-leads__pager-btn--next"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AdminCartDetailsModal
        open={Boolean(cartUser)}
        onClose={() => setCartUser(null)}
        userId={cartUser ? userIdOf(cartUser) : null}
        fallbackUser={cartUser}
      />

      <AdminCustomerDetailsModal
        open={Boolean(detailUser)}
        onClose={() => setDetailUser(null)}
        userId={detailUser ? userIdOf(detailUser) : null}
        initialUser={detailUser}
        onViewCart={(id, user) => {
          setDetailUser(null)
          setCartUser(user || { _id: id, id })
        }}
      />
    </div>
  )
}
