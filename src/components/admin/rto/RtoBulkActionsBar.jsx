import { useState } from 'react'
import {
  RotateCcw,
  XCircle,
  CheckCircle2,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export function RtoBulkActionsBar({
  selectedOrderIds = [],
  onClearSelection,
  onBulkAction,
  isExecuting,
}) {
  const [activeModal, setActiveModal] = useState(null) // 'refund' | 'reject' | 'close' | null
  const [reason, setReason] = useState('')
  const [progressResult, setProgressResult] = useState(null)

  if (!selectedOrderIds || selectedOrderIds.length === 0) return null

  const handleOpenAction = (action) => {
    setActiveModal(action)
    setReason('')
    setProgressResult(null)
  }

  const handleExecute = async () => {
    try {
      const res = await onBulkAction({
        action: activeModal,
        orderIds: selectedOrderIds,
        reason: reason.trim() || undefined,
      })
      setProgressResult({
        success: true,
        message: res?.message || `Successfully processed bulk ${activeModal}`,
        results: res?.data?.results || res?.results || [],
      })
    } catch (err) {
      setProgressResult({
        success: false,
        message: err?.message || `Bulk ${activeModal} encountered errors`,
        results: err?.data?.results || [],
      })
    }
  }

  const handleCloseModal = () => {
    setActiveModal(null)
    setReason('')
    setProgressResult(null)
    if (progressResult?.success) {
      onClearSelection()
    }
  }

  return (
    <>
      <aside className="rto-bulk-bar" aria-label="Bulk actions">
        <div className="rto-bulk-bar__info">
          <span className="rto-bulk-bar__count">
            {selectedOrderIds.length}
          </span>
          <span className="rto-bulk-bar__label">
            order{selectedOrderIds.length > 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="rto-bulk-bar__actions">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleOpenAction('refund')}
            disabled={isExecuting}
            className="rto-bulk-btn--refund"
          >
            <RotateCcw size={14} />
            Bulk Refund
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenAction('reject')}
            disabled={isExecuting}
            className="rto-bulk-btn--reject"
          >
            <XCircle size={14} />
            Bulk Reject
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleOpenAction('close')}
            disabled={isExecuting}
            className="rto-bulk-btn--close"
          >
            <CheckCircle2 size={14} />
            Bulk Close
          </Button>

          <button
            type="button"
            className="rto-bulk-bar__clear"
            onClick={onClearSelection}
            title="Clear selection"
            aria-label="Clear selection"
          >
            <X size={16} />
          </button>
        </div>
      </aside>

      {activeModal && (
        <Modal
          open={Boolean(activeModal)}
          onOpenChange={handleCloseModal}
          title={
            progressResult
              ? 'Bulk Action Results'
              : `Confirm Bulk ${activeModal.toUpperCase()}`
          }
          subtitle={
            progressResult
              ? 'Execution status summary for selected orders'
              : `Apply action to ${selectedOrderIds.length} selected orders`
          }
          footer={
            <div className="flex justify-end gap-2 w-full">
              {progressResult ? (
                <Button variant="primary" size="sm" onClick={handleCloseModal}>
                  Done
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseModal}
                    disabled={isExecuting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={activeModal === 'reject' ? 'destructive' : 'primary'}
                    size="sm"
                    onClick={handleExecute}
                    disabled={isExecuting}
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Processing…
                      </>
                    ) : (
                      `Apply ${activeModal}`
                    )}
                  </Button>
                </>
              )}
            </div>
          }
        >
          <div className="rto-modal-body">
            {!progressResult ? (
              <div className="flex flex-col gap-3">
                <div className="rto-modal-alert">
                  <AlertTriangle size={16} />
                  <span>
                    You are about to execute <strong>{activeModal.toUpperCase()}</strong> on{' '}
                    <strong>{selectedOrderIds.length}</strong> selected orders. This action cannot
                    be undone.
                  </span>
                </div>

                {activeModal === 'reject' && (
                  <div>
                    <label className="text-xs font-semibold text-ink block mb-1">
                      Reason for Rejection
                    </label>
                    <textarea
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="rto-modal-textarea"
                      placeholder="Enter rejection explanation for selected orders..."
                    />
                  </div>
                )}

                {activeModal === 'refund' && (
                  <p className="text-xs text-muted">
                    Refunds will be issued according to calculated net eligible amounts after
                    standard deductions.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div
                  className={`rto-modal-alert ${
                    progressResult.success ? 'rto-modal-alert--success' : ''
                  }`}
                >
                  {progressResult.success ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <AlertTriangle size={16} className="text-rose-600" />
                  )}
                  <span>{progressResult.message}</span>
                </div>

                {progressResult.results?.length > 0 && (
                  <div className="rto-results-list">
                    {progressResult.results.map((res, idx) => (
                      <div key={idx} className="rto-result-row">
                        <span className="font-mono text-xs font-semibold">
                          #{res.orderId || res.id}
                        </span>
                        <span
                          className={`rto-result-status ${
                            res.success || res.status === 'success'
                              ? 'is-success'
                              : 'is-error'
                          }`}
                        >
                          {res.status || (res.success ? 'Success' : 'Failed')}
                          {res.error ? `: ${res.error}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
