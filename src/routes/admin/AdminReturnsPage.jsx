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
import { useAdminReturnRequests } from '@/features/admin/hooks'

export default function AdminReturnsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useAdminReturnRequests({ page })
  const { items: requests, pagination } = useMemo(
    () => extractListPayload(data, ['requests', 'returns']),
    [data]
  )

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Operations" title="Returns & refunds" />
      <div className="admin-card admin-card--flush">
        {isLoading && <AdminLoading />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}
        {!isLoading && requests.length === 0 && <AdminEmpty message="No return requests." />}
        {!isLoading && requests.length > 0 && (
          <AdminTable
            columns={[
              { key: 'orderId', label: 'Order', render: (r) => r.orderId || r.id || '—' },
              { key: 'customer', label: 'Customer', render: (r) => r.customerName || r.userEmail || '—' },
              { key: 'status', label: 'Status', render: (r) => r.status || r.returnStatus || '—' },
              { key: 'amount', label: 'Amount', render: (r) => formatPrice(r.refundAmount ?? r.totalAmount) },
              {
                key: 'date',
                label: 'Requested',
                render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'),
              },
            ]}
            rows={requests}
            getRowKey={(r) => r.orderId || r._id || r.id}
          />
        )}
        <AdminPagination page={page} totalPages={pagination?.totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
