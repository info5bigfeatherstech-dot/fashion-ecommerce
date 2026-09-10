import { useMemo, useState } from 'react'
import { Eye, MessageSquare, RotateCcw, CheckCircle, XCircle } from 'lucide-react'
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
import { AdminReturnDetailModal } from '@/features/admin/components/AdminReturnDetailModal'
import { Button } from '@/components/ui/Button'

function getReturnStatusBadge(status = '') {
  const st = String(status).toLowerCase()
  if (['approved', 'qc_passed', 'refunded'].includes(st)) {
    return <span className="admin-badge admin-badge--success">{status}</span>
  }
  if (['rejected', 'approval_failed'].includes(st)) {
    return <span className="admin-badge admin-badge--danger">{status}</span>
  }
  if (['received', 'refund_pending', 'pickup_in_progress'].includes(st)) {
    return <span className="admin-badge admin-badge--info">{status.replace(/_/g, ' ')}</span>
  }
  return <span className="admin-badge admin-badge--warning">{status || 'requested'}</span>
}

export default function AdminReturnsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const { data, isLoading, isError, error, refetch } = useAdminReturnRequests({ page, status })
  const decide = useDecideAdminReturnRequest()
  const refund = useInitiateAdminReturnRefund()
  const retryPickup = useRetryAdminReturnReversePickup()

  const { items: requests, pagination } = useMemo(
    () => extractListPayload(data, ['requests', 'returns']),
    [data]
  )

  const handleDecision = async (orderId, decision) => {
    const reason = decision === 'reject' ? window.prompt('Rejection reason (required):') || '' : ''
    if (decision === 'reject' && !reason.trim()) {
      toast.error('Rejection reason is required to reject a return')
      return
    }

    try {
      await decide.mutateAsync({
        orderId,
        decision,
        decisionReason: reason.trim(),
        customerRequest: 'REFUND',
      })
      toast.success(decision === 'approve' ? 'Return approved & reverse pickup initiated' : 'Return request rejected')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not update return request')
    }
  }

  const handleRefund = async (orderId) => {
    if (!window.confirm(`Initiate online return refund for order #${orderId}?`)) return
    try {
      const res = await refund.mutateAsync(orderId)
      toast.success(res?.message || 'Refund initiated successfully')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Refund initiation failed')
    }
  }

  const handleRetryPickup = async (orderId) => {
    try {
      await retryPickup.mutateAsync(orderId)
      toast.success('Reverse pickup retry requested')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Reverse pickup retry failed')
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Operations" title="Product Returns & Refunds">
        <Button variant="ghost" size="sm" onClick={() => refetch()}>Refresh</Button>
      </AdminPageHeader>

      <div className="admin-tabs">
        {[
          { id: '', label: 'All Returns' },
          { id: 'requested', label: 'Requested' },
          { id: 'approved', label: 'Approved' },
          { id: 'received', label: 'Received / QC' },
          { id: 'refunded', label: 'Refunded' },
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
        {!isLoading && requests.length === 0 && <AdminEmpty message="No return requests found." />}
        {!isLoading && requests.length > 0 && (
          <AdminTable
            columns={[
              {
                key: 'orderId',
                label: 'Order ID',
                render: (r) => (
                  <button
                    type="button"
                    className="admin-link font-semibold"
                    onClick={() => setSelectedOrderId(r.orderId || r.id)}
                    style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' }}
                  >
                    {r.orderId || r.id || '—'}
                  </button>
                ),
              },
              {
                key: 'customer',
                label: 'Customer',
                render: (r) => (
                  <div>
                    <p className="body-sm font-medium">{r.customerName || r.user?.name || r.shippingAddress?.fullName || '—'}</p>
                    <p className="body-xs text-muted">{r.customerPhone || r.user?.phone || '—'}</p>
                  </div>
                ),
              },
              {
                key: 'reason',
                label: 'Reason',
                render: (r) => {
                  const reason = r.returnInfo?.reasonType || r.reasonType || 'damaged'
                  return (
                    <span className="body-xs font-semibold" style={{ textTransform: 'capitalize' }}>
                      {reason.replace('_', ' ')}
                    </span>
                  )
                },
              },
              {
                key: 'status',
                label: 'Status',
                render: (r) => {
                  const st = r.returnInfo?.status || r.returnStatus || r.status || 'requested'
                  return getReturnStatusBadge(st)
                },
              },
              {
                key: 'reverseAwb',
                label: 'Reverse AWB',
                render: (r) => {
                  const awb = r.returnInfo?.reverseAwb || r.returnInfo?.trackingNumber || r.reverseAwb
                  return awb ? (
                    <span className="body-xs font-mono font-semibold">{awb}</span>
                  ) : (
                    <span className="body-xs text-muted">—</span>
                  )
                },
              },
              {
                key: 'amount',
                label: 'Refund Amount',
                render: (r) => formatPrice(r.refundAmount ?? r.totalAmount ?? 0),
              },
              {
                key: 'date',
                label: 'Requested Date',
                render: (r) => {
                  const dt = r.returnInfo?.requestedAt || r.requestedAt || r.createdAt
                  return dt ? new Date(dt).toLocaleDateString() : '—'
                },
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (r) => {
                  const orderId = r.orderId || r.id
                  const st = String(r.returnInfo?.status || r.returnStatus || r.status || '').toLowerCase()
                  const isRequested = st === 'requested' || st === 'pending'
                  const canRetry = st === 'approval_failed' || (st === 'approved' && !r.returnInfo?.reverseAwb)
                  const canRefund = ['received', 'qc_passed', 'refund_pending'].includes(st)

                  return (
                    <div className="admin-row-actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedOrderId(orderId)}
                        title="View Full Return Details & Chat"
                      >
                        <Eye size={13} />
                        View
                      </Button>

                      {isRequested && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleDecision(orderId, 'approve')}
                            disabled={decide.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDecision(orderId, 'reject')}
                            disabled={decide.isPending}
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {canRetry && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRetryPickup(orderId)}
                          disabled={retryPickup.isPending}
                        >
                          <RotateCcw size={13} /> Retry
                        </Button>
                      )}

                      {canRefund && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleRefund(orderId)}
                          disabled={refund.isPending}
                          style={{ background: '#059669', borderColor: '#059669' }}
                        >
                          Refund
                        </Button>
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

      {selectedOrderId && (
        <AdminReturnDetailModal
          open={Boolean(selectedOrderId)}
          onClose={() => setSelectedOrderId(null)}
          orderId={selectedOrderId}
          initialData={requests.find((r) => (r.orderId || r.id) === selectedOrderId)}
          onUpdated={() => refetch()}
        />
      )}
    </div>
  )
}
