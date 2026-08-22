import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { OrderPaymentSummaryCard } from '@/features/admin/components/OrderPaymentSummaryCard'
import { useAdminOrderDetail, useAdminOrdersList, useAdminOrdersSummary } from '@/features/admin/hooks'

const BUCKETS = ['Pending', 'Confirmed', 'Processing', 'Delivered', 'Cancelled']

export default function AdminOrdersPage() {
  const [bucket, setBucket] = useState('Pending')
  const [page, setPage] = useState(1)
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const { data: summary } = useAdminOrdersSummary()
  const { data: listData, isLoading, isError, error } = useAdminOrdersList({ bucket, page })
  const { data: orderDetail, isFetching: detailLoading } = useAdminOrderDetail(selectedOrderId, {
    enabled: Boolean(selectedOrderId),
  })

  const orders = useMemo(() => {
    const rows = listData?.data?.orders || listData?.orders || listData?.data || []
    return Array.isArray(rows) ? rows : []
  }, [listData])

  const pagination = listData?.data?.pagination || listData?.pagination || {}

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="heading-sm text-accent">Operations</p>
          <h1 className="display-md">Orders</h1>
        </div>
        {summary?.totals && (
          <div className="admin-stat-row">
            <div className="admin-stat">
              <span>Pending</span>
              <strong>{summary.totals.pending ?? '—'}</strong>
            </div>
            <div className="admin-stat">
              <span>Confirmed</span>
              <strong>{summary.totals.confirmed ?? '—'}</strong>
            </div>
          </div>
        )}
      </header>

      <div className="admin-tabs">
        {BUCKETS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`admin-tabs__btn${bucket === tab ? ' is-active' : ''}`}
            onClick={() => {
              setBucket(tab)
              setPage(1)
              setSelectedOrderId(null)
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="admin-orders-layout">
        <section className="admin-card admin-card--flush">
          {isLoading && (
            <div className="admin-empty">
              <Loader2 className="payment-overlay__spinner" size={22} />
              <p>Loading orders…</p>
            </div>
          )}
          {isError && (
            <div className="admin-empty">
              <p>{error?.message || 'Could not load orders'}</p>
            </div>
          )}
          {!isLoading && !isError && orders.length === 0 && (
            <div className="admin-empty">
              <p>No orders in {bucket}.</p>
            </div>
          )}
          {!isLoading && orders.length > 0 && (
            <ul className="admin-order-list">
              {orders.map((order) => {
                const id = order.orderId || order.id || order._id
                const active = String(selectedOrderId) === String(id)
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={`admin-order-row${active ? ' is-active' : ''}`}
                      onClick={() => setSelectedOrderId(id)}
                    >
                      <div>
                        <strong>#{id}</strong>
                        <p className="body-sm text-muted">{order.customerName || order.userEmail || 'Customer'}</p>
                      </div>
                      <div className="admin-order-row__meta">
                        <span>{formatPrice(order.totalAmount)}</span>
                        <span className="admin-badge">{order.orderStatus || order.status || '—'}</span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {pagination?.totalPages > 1 && (
            <div className="admin-pagination">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="body-sm text-muted">Page {page} of {pagination.totalPages}</span>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </section>

        <aside className="admin-detail-panel">
          {!selectedOrderId && (
            <div className="admin-empty">
              <p>Select an order to view payment details.</p>
            </div>
          )}
          {selectedOrderId && detailLoading && (
            <div className="admin-empty">
              <Loader2 className="payment-overlay__spinner" size={22} />
              <p>Loading order…</p>
            </div>
          )}
          {selectedOrderId && orderDetail && !detailLoading && (
            <>
              <div className="admin-card">
                <div className="admin-card__head">
                  <div>
                    <h2 className="admin-card__title">Order #{selectedOrderId}</h2>
                    <p className="admin-card__subtitle">
                      {orderDetail.orderStatus || orderDetail.status || '—'}
                    </p>
                  </div>
                </div>
                <div className="admin-payment-grid">
                  <div className="admin-payment-row">
                    <span>Customer</span>
                    <strong>{orderDetail.customerName || orderDetail.userEmail || '—'}</strong>
                  </div>
                  <div className="admin-payment-row">
                    <span>Placed</span>
                    <strong>
                      {orderDetail.createdAt
                        ? new Date(orderDetail.createdAt).toLocaleString()
                        : '—'}
                    </strong>
                  </div>
                </div>
              </div>
              <OrderPaymentSummaryCard order={orderDetail} showRazorpayIds />
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
