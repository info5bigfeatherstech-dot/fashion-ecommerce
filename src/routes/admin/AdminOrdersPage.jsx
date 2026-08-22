import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { OrderPaymentSummaryCard } from '@/features/admin/components/OrderPaymentSummaryCard'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  AdminStatRow,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import {
  useAdminOrderDetail,
  useAdminOrdersList,
  useAdminOrdersSummary,
  useAutoSyncOrderStatuses,
  useBulkConfirmOrders,
} from '@/features/admin/hooks'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const BUCKETS = ['Pending', 'Confirmed', 'Processing', 'Delivered', 'Cancelled', 'RTO']

export default function AdminOrdersPage() {
  const [bucket, setBucket] = useState('Pending')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const { data: summary } = useAdminOrdersSummary()
  const { data: listData, isLoading, isError, error, refetch } = useAdminOrdersList({
    bucket,
    page,
    search,
  })
  const { data: orderDetail, isFetching: detailLoading } = useAdminOrderDetail(selectedOrderId, {
    enabled: Boolean(selectedOrderId),
  })
  const confirmOrders = useBulkConfirmOrders()
  const syncStatuses = useAutoSyncOrderStatuses()

  const { items: orders, pagination } = useMemo(
    () => extractListPayload(listData, ['orders']),
    [listData]
  )

  const totals = summary?.totals || summary?.buckets || {}

  const handleConfirmSelected = async () => {
    if (!selectedOrderId) return
    try {
      await confirmOrders.mutateAsync([selectedOrderId])
      toast.success('Order confirmed')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not confirm order')
    }
  }

  const items = orderDetail?.items || orderDetail?.orderItems || []

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Operations" title="Orders">
        <AdminStatRow stats={[
          { label: 'Pending', value: totals.pending ?? totals.Pending ?? '—' },
          { label: 'Confirmed', value: totals.confirmed ?? totals.Confirmed ?? '—' },
          { label: 'Delivered', value: totals.delivered ?? totals.Delivered ?? '—' },
        ]} />
      </AdminPageHeader>

      <div className="admin-toolbar">
        <form
          className="admin-toolbar__search"
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(searchInput.trim())
            setPage(1)
          }}
        >
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search order ID, customer…"
            aria-label="Search orders"
          />
          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </form>
        <Button
          variant="ghost"
          size="sm"
          disabled={syncStatuses.isPending}
          onClick={() => syncStatuses.mutateAsync({})}
        >
          {syncStatuses.isPending ? 'Syncing…' : 'Sync statuses'}
        </Button>
      </div>

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
          {isLoading && <AdminLoading label="Loading orders…" />}
          {isError && <AdminError message={error?.message} onRetry={refetch} />}
          {!isLoading && !isError && orders.length === 0 && (
            <AdminEmpty message={`No orders in ${bucket}.`} />
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
                        <span>{formatPrice(order.totalAmount ?? order.amountPayable)}</span>
                        <span className="admin-badge">{order.orderStatus || order.status || '—'}</span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <AdminPagination
            page={page}
            totalPages={pagination?.totalPages}
            onPageChange={setPage}
          />
        </section>

        <aside className="admin-detail-panel">
          {!selectedOrderId && <AdminEmpty message="Select an order to view details." />}
          {selectedOrderId && detailLoading && <AdminLoading label="Loading order…" />}
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
                  {bucket === 'Pending' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={confirmOrders.isPending}
                      onClick={handleConfirmSelected}
                    >
                      Confirm
                    </Button>
                  )}
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
                  {orderDetail.shippingAddress && (
                    <div className="admin-payment-row">
                      <span>Address</span>
                      <strong>
                        {[
                          orderDetail.shippingAddress.fullAddress,
                          orderDetail.shippingAddress.city,
                          orderDetail.shippingAddress.postalCode,
                        ].filter(Boolean).join(', ') || '—'}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {items.length > 0 && (
                <div className="admin-card">
                  <h3 className="admin-card__title">Items</h3>
                  <ul className="admin-item-list">
                    {items.map((item, idx) => (
                      <li key={item.id || item._id || idx} className="admin-item-row">
                        <span>{item.name || item.productName || 'Item'}</span>
                        <span>×{item.quantity || 1}</span>
                        <span>{formatPrice(item.price || item.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <OrderPaymentSummaryCard order={orderDetail} showRazorpayIds />
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
