import { useMemo, useState } from 'react'
import { Pencil, Plus, Power, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AdminCouponModal } from '@/features/admin/components/AdminCouponModal'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  AdminTable,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import {
  useAdminCoupons,
  useDeleteAdminCoupon,
  useToggleAdminCoupon,
} from '@/features/admin/hooks'
import { Button } from '@/components/ui/Button'

function formatDiscount(row) {
  const value = row.discountValue ?? row.discount
  if (value == null || value === '') return '—'
  const type = String(row.discountType || row.type || '').toLowerCase()
  if (type === 'percentage' || type === 'percent') return `${value}%`
  if (type === 'fixed' || type === 'flat') return `₹${value}`
  return String(value)
}

function formatType(row) {
  const type = String(row.discountType || row.type || '').toLowerCase()
  if (type === 'percentage' || type === 'percent') return 'Percentage'
  if (type === 'fixed' || type === 'flat') return 'Fixed amount'
  return row.discountType || row.type || '—'
}

export default function AdminCouponsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const { data, isLoading, isError, error, refetch } = useAdminCoupons({ page, status })
  const toggle = useToggleAdminCoupon()
  const deleteCoupon = useDeleteAdminCoupon()

  const { items: coupons, pagination } = useMemo(
    () => extractListPayload(data, ['coupons']),
    [data]
  )

  const handleToggle = async (row) => {
    const id = row._id || row.id
    if (!id || busyId) return
    setBusyId(id)
    try {
      await toggle.mutateAsync(id)
      toast.success(row.isActive === false ? 'Coupon activated' : 'Coupon deactivated')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not update coupon')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (coupon) => {
    const id = coupon._id || coupon.id
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return
    setBusyId(id)
    try {
      await deleteCoupon.mutateAsync(id)
      toast.success('Coupon deleted')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not delete coupon')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="admin-page admin-coupons">
      <AdminPageHeader eyebrow="Marketing" title="Coupons">
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingCoupon(null)
            setShowModal(true)
          }}
        >
          <Plus size={14} /> Create coupon
        </Button>
      </AdminPageHeader>

      <div className="admin-tabs">
        {['all', 'active', 'inactive'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`admin-tabs__btn${status === tab ? ' is-active' : ''}`}
            onClick={() => {
              setStatus(tab)
              setPage(1)
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-card admin-card--flush">
        {isLoading && <AdminLoading />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}
        {!isLoading && coupons.length === 0 && <AdminEmpty message="No coupons found." />}
        {!isLoading && coupons.length > 0 && (
          <AdminTable
            columns={[
              {
                key: 'code',
                label: 'Code',
                render: (r) => (
                  <code className="admin-coupons__code">{r.code || '—'}</code>
                ),
              },
              { key: 'name', label: 'Name', render: (r) => r.name || '—' },
              {
                key: 'discount',
                label: 'Discount',
                render: (r) => <strong className="admin-coupons__discount">{formatDiscount(r)}</strong>,
              },
              { key: 'type', label: 'Type', render: (r) => formatType(r) },
              {
                key: 'expiry',
                label: 'Expires',
                render: (r) => (r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : '—'),
              },
              {
                key: 'status',
                label: 'Status',
                render: (r) => {
                  const active = r.isActive !== false
                  const id = r._id || r.id
                  const busy = busyId === id
                  return (
                    <div className="admin-coupons__status-cell">
                      <span
                        className={`admin-badge${active ? ' admin-badge--success' : ' admin-badge--warn'}`}
                      >
                        {active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={active}
                        aria-label={active ? `Deactivate ${r.code}` : `Activate ${r.code}`}
                        className={`admin-coupons__switch${active ? ' is-on' : ''}`}
                        disabled={busy || toggle.isPending}
                        onClick={() => handleToggle(r)}
                        title={active ? 'Turn off' : 'Turn on'}
                      >
                        <span className="admin-coupons__switch-thumb" aria-hidden />
                        <Power size={11} className="admin-coupons__switch-icon" aria-hidden />
                      </button>
                    </div>
                  )
                },
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (r) => {
                  const id = r._id || r.id
                  const busy = busyId === id
                  return (
                    <div className="admin-coupons__actions">
                      <button
                        type="button"
                        className="admin-coupons__icon-btn"
                        aria-label={`Edit ${r.code}`}
                        disabled={busy}
                        onClick={() => {
                          setEditingCoupon(r)
                          setShowModal(true)
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="admin-coupons__icon-btn admin-coupons__icon-btn--danger"
                        aria-label={`Delete ${r.code}`}
                        disabled={busy || deleteCoupon.isPending}
                        onClick={() => handleDelete(r)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                },
              },
            ]}
            rows={coupons}
            getRowKey={(r) => r._id || r.id}
          />
        )}
        <AdminPagination page={page} totalPages={pagination?.totalPages} onPageChange={setPage} />
      </div>

      <AdminCouponModal
        open={showModal}
        onOpenChange={setShowModal}
        coupon={editingCoupon}
        onSaved={() => refetch()}
      />
    </div>
  )
}
