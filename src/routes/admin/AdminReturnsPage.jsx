import { useMemo, useState } from 'react'
import { toast } from 'sonner'
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
import {
  useAdminReturnRequests,
  useDecideAdminReturnRequest,
  useInitiateAdminReturnRefund,
  useRetryAdminReturnReversePickup,
} from '@/features/admin/hooks'
import { Button } from '@/components/ui/Button'

export default function AdminReturnsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading, isError, error, refetch } = useAdminReturnRequests({ page, status })
  const decide = useDecideAdminReturnRequest()
  const refund = useInitiateAdminReturnRefund()
  const retryPickup = useRetryAdminReturnReversePickup()

  const { items: requests, pagination } = useMemo(
    () => extractListPayload(data, ['requests', 'returns']),
    [data]
  )

  const handleDecision = async (orderId, decision) => {
    const reason = decision === 'reject' ? window.prompt('Rejection reason (optional):') || '' : ''
    try {
      await decide.mutateAsync({ orderId, decision, decisionReason: reason })
      toast.success(decision === 'approve' ? 'Return approved' : 'Return rejected')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not update return request')
    }
  }

  const handleRefund = async (orderId) => {
    if (!window.confirm('Initiate refund for this return?')) return
    try {
      await refund.mutateAsync(orderId)
      toast.success('Refund initiated')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Refund failed')
    }
  }

  const handleRetryPickup = async (orderId) => {
    try {
      await retryPickup.mutateAsync(orderId)
      toast.success('Reverse pickup retry sent')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Retry failed')
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Operations" title="Returns & refunds">
        <Button variant="ghost" size="sm" onClick={() => refetch()}>Refresh</Button>
      </AdminPageHeader>

      <div className="admin-tabs">
        {[
          { id: '', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'approved', label: 'Approved' },
          { id: 'rejected', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.id || 'all'}
            type="button"
            className={`admin-tabs__btn${status === tab.id ? ' is-active' : ''}`}
            onClick={() => { setStatus(tab.id); setPage(1) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-card admin-card--flush">
        {isLoading && <AdminLoading />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}
        {!isLoading && requests.length === 0 && <AdminEmpty message="No return requests." />}
        {!isLoading && requests.length > 0 && (
          <AdminTable
            columns={[
              { key: 'orderId', label: 'Order', render: (r) => r.orderId || r.id || '—' },
              { key: 'customer', label: 'Customer', render: (r) => r.customerName || r.userEmail || '—' },
              {
                key: 'status',
                label: 'Status',
                render: (r) => (
                  <span className="admin-badge">{r.status || r.returnStatus || '—'}</span>
                ),
              },
              { key: 'amount', label: 'Amount', render: (r) => formatPrice(r.refundAmount ?? r.totalAmount) },
              {
                key: 'date',
                label: 'Requested',
                render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'),
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (r) => {
                  const orderId = r.orderId || r.id
                  const st = String(r.status || r.returnStatus || '').toLowerCase()
                  return (
                    <div className="admin-row-actions">
                      {st.includes('pending') && (
                        <>
                          <Button variant="primary" size="sm" onClick={() => handleDecision(orderId, 'approve')}>
                            Approve
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDecision(orderId, 'reject')}>
                            Reject
                          </Button>
                        </>
                      )}
                      {st.includes('approved') && (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => handleRefund(orderId)}>
                            Refund
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRetryPickup(orderId)}>
                            Retry pickup
                          </Button>
                        </>
                      )}
                    </div>
                  )
                },
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
