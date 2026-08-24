import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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

export default function AdminCouponsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)

  const { data, isLoading, isError, error, refetch } = useAdminCoupons({ page, status })
  const toggle = useToggleAdminCoupon()
  const deleteCoupon = useDeleteAdminCoupon()

  const { items: coupons, pagination } = useMemo(
    () => extractListPayload(data, ['coupons']),
    [data]
  )

  const handleToggle = async (id) => {
    try {
      await toggle.mutateAsync(id)
      toast.success('Coupon updated')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not update coupon')
    }
  }

  const handleDelete = async (coupon) => {
    const id = coupon._id || coupon.id
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return
    try {
      await deleteCoupon.mutateAsync(id)
      toast.success('Coupon deleted')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not delete coupon')
    }
  }

  return (
    <div className="admin-page">
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
            onClick={() => { setStatus(tab); setPage(1) }}
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
              { key: 'code', label: 'Code', render: (r) => r.code || '—' },
              { key: 'name', label: 'Name', render: (r) => r.name || '—' },
              { key: 'discount', label: 'Discount', render: (r) => r.discountValue ?? r.discount ?? '—' },
              { key: 'type', label: 'Type', render: (r) => r.discountType || r.type || '—' },
              {
                key: 'expiry',
                label: 'Expires',
                render: (r) => (r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : '—'),
              },
              {
                key: 'status',
                label: 'Status',
                render: (r) => (
                  <span className={`admin-badge${r.isActive === false ? ' admin-badge--warn' : ' admin-badge--success'}`}>
                    {r.isActive === false ? 'Inactive' : 'Active'}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: '',
                render: (r) => (
                  <div className="admin-row-actions">
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(r._id || r.id)}>
                      Toggle
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Edit"
                      onClick={() => {
                        setEditingCoupon(r)
                        setShowModal(true)
                      }}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" aria-label="Delete" onClick={() => handleDelete(r)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ),
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
