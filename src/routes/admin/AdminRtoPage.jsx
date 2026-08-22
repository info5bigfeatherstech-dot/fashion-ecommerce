import { useMemo, useState } from 'react'
import { formatPrice } from '@/lib/utils'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  AdminStatRow,
  AdminTable,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import { useAdminRtoAnalytics, useAdminRtoOrders } from '@/features/admin/hooks'

export default function AdminRtoPage() {
  const [page, setPage] = useState(1)
  const { data: analytics } = useAdminRtoAnalytics()
  const { data, isLoading, isError, error, refetch } = useAdminRtoOrders({ page })
  const { items: orders, pagination } = useMemo(
    () => extractListPayload(data, ['orders']),
    [data]
  )

  const stats = analytics ? [
    { label: 'Total RTO', value: analytics.total ?? analytics.totalRto ?? '—' },
    { label: 'Pending refund', value: analytics.pendingRefund ?? '—' },
    { label: 'Refunded', value: analytics.refunded ?? '—' },
  ] : []

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Operations" title="RTO orders">
        <AdminStatRow stats={stats} />
      </AdminPageHeader>
      <div className="admin-card admin-card--flush">
        {isLoading && <AdminLoading />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}
        {!isLoading && orders.length === 0 && <AdminEmpty message="No RTO orders." />}
        {!isLoading && orders.length > 0 && (
          <AdminTable
            columns={[
              { key: 'orderId', label: 'Order', render: (r) => r.orderId || r.id || '—' },
              { key: 'customer', label: 'Customer', render: (r) => r.customerName || r.userEmail || '—' },
              { key: 'status', label: 'Status', render: (r) => r.rtoStatus || r.status || '—' },
              { key: 'amount', label: 'Amount', render: (r) => formatPrice(r.totalAmount) },
            ]}
            rows={orders}
            getRowKey={(r) => r.orderId || r._id}
          />
        )}
        <AdminPagination page={page} totalPages={pagination?.totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
