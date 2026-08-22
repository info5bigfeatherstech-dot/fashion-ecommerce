import { useMemo, useState } from 'react'
import { formatPrice } from '@/lib/utils'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  AdminTable,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import { useAdminCarts } from '@/features/admin/hooks'

const VARIANTS = [
  { id: 'all', label: 'All carts' },
  { id: 'abandoned', label: 'Abandoned' },
  { id: 'high-value', label: 'High value' },
]

export default function AdminCartsPage() {
  const [page, setPage] = useState(1)
  const [variant, setVariant] = useState('all')
  const { data, isLoading, isError, error, refetch } = useAdminCarts({ variant, page })
  const { items: carts, pagination } = useMemo(
    () => extractListPayload(data, ['carts']),
    [data]
  )

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Leads" title="Carts" />
      <div className="admin-tabs">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`admin-tabs__btn${variant === v.id ? ' is-active' : ''}`}
            onClick={() => { setVariant(v.id); setPage(1) }}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="admin-card admin-card--flush">
        {isLoading && <AdminLoading />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}
        {!isLoading && carts.length === 0 && <AdminEmpty message="No carts found." />}
        {!isLoading && carts.length > 0 && (
          <AdminTable
            columns={[
              { key: 'user', label: 'Customer', render: (r) => r.userEmail || r.userName || r.userId || '—' },
              { key: 'items', label: 'Items', render: (r) => r.itemCount ?? r.items?.length ?? '—' },
              { key: 'total', label: 'Value', render: (r) => formatPrice(r.totalAmount ?? r.subtotal) },
              {
                key: 'updated',
                label: 'Updated',
                render: (r) => (r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'),
              },
            ]}
            rows={carts}
            getRowKey={(r) => r._id || r.id || r.cartId}
          />
        )}
        <AdminPagination page={page} totalPages={pagination?.totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
