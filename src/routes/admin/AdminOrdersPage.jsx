import { useMemo, useState } from 'react'
import { ChevronDown, Download } from 'lucide-react'
import { toast } from 'sonner'
import { AdminOrderDetailView } from '@/features/admin/components/AdminOrderDetailView'
import {
  ORDER_TAB_ORDER,
  ORDER_TAB_LABEL_TO_BUCKET,
} from '@/features/admin/api/orders'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import {
  useAdminOrderDetail,
  useAdminOrdersList,
  useAdminOrdersSummary,
  useAutoSyncOrderStatuses,
  useBulkCancelOrders,
  useBulkConfirmOrders,
  useBulkSchedulePickupOrders,
  useBulkShipNowOrders,
  useBulkSyncShiprocketOrders,
  useDownloadBulkManifestsZip,
  useDownloadBulkShippingLabelsZip,
  useDownloadBulkTaxInvoicesZip,
} from '@/features/admin/hooks'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ActionMenu } from '@/components/ui/DropdownMenu'

function formatInr(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

function providerLabel(order) {
  const provider = String(order?.shippingProvider || '').toLowerCase()
  if (provider === 'shipmozo') return 'Shipmozo'
  if (provider === 'shiprocket' || provider) return provider === 'shiprocket' ? 'Shiprocket' : provider
  return null
}

function paymentTone(label) {
  const s = String(label || '').toLowerCase()
  if (s.includes('paid') && !s.includes('un')) return 'success'
  if (s.includes('partial')) return 'warn'
  if (s.includes('cod')) return 'muted'
  return 'muted'
}

function tomorrowYmd() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function AdminOrdersPage() {
  const [bucket, setBucket] = useState('Pending')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [selectedOrders, setSelectedOrders] = useState([])
  const [showBulkMenu, setShowBulkMenu] = useState(false)
  const [pickupDate, setPickupDate] = useState(tomorrowYmd())
  const [showPickupPanel, setShowPickupPanel] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'detail'

  const { data: summary, refetch: refetchSummary } = useAdminOrdersSummary()
  const { data: listData, isLoading, isError, error, refetch } = useAdminOrdersList({
    bucket,
    page,
    search,
  })
  const { data: orderDetail, isFetching: detailLoading, refetch: refetchDetail, isError: detailIsError, error: detailError } = useAdminOrderDetail(selectedOrderId, {
    enabled: Boolean(selectedOrderId),
  })
  const confirmOrders = useBulkConfirmOrders()
  const cancelOrders = useBulkCancelOrders()
  const shipNow = useBulkShipNowOrders()
  const schedulePickup = useBulkSchedulePickupOrders()
  const syncShiprocket = useBulkSyncShiprocketOrders()
  const taxInvoicesZip = useDownloadBulkTaxInvoicesZip()
  const shippingLabelsZip = useDownloadBulkShippingLabelsZip()
  const manifestsZip = useDownloadBulkManifestsZip()
  const syncStatuses = useAutoSyncOrderStatuses()

  const { items: orders, pagination } = useMemo(
    () => extractListPayload(listData, ['orders']),
    [listData]
  )

  const totals = summary?.totals || {}
  const countsByBucket = summary?.countsByBucket || {}

  const summaryStats = useMemo(() => ([
    { label: 'Total Orders', value: String(totals.totalOrders ?? pagination?.total ?? orders.length ?? 0) },
    { label: 'Total Revenue', value: formatInr(totals.totalRevenueInr) },
    { label: 'Total Pending Orders', value: String(totals.totalPendingOrders ?? countsByBucket.new ?? 0) },
    { label: 'Total Completed Orders', value: String(totals.totalCompletedOrders ?? countsByBucket.completed ?? 0) },
  ]), [totals, countsByBucket, pagination, orders.length])

  const tabs = useMemo(() => (
    ORDER_TAB_ORDER.map((label) => {
      const key = ORDER_TAB_LABEL_TO_BUCKET[label]
      return { label, count: countsByBucket[key] ?? 0 }
    })
  ), [countsByBucket])

  const refreshList = () => {
    refetch()
    refetchSummary()
  }

  const toggleSelectOrder = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([])
      return
    }
    setSelectedOrders(orders.map((o) => o.orderId || o.id || o._id).filter(Boolean))
  }

  const handleConfirm = async (orderIds) => {
    const ids = (Array.isArray(orderIds) ? orderIds : [orderIds]).filter(Boolean)
    if (!ids.length) return
    try {
      await confirmOrders.mutateAsync(ids)
      toast.success(ids.length > 1 ? `${ids.length} orders confirmed` : 'Order confirmed')
      setSelectedOrders([])
      refreshList()
    } catch (err) {
      toast.error(err?.message || 'Could not confirm order')
    }
  }

  const handleCancel = async (orderIds) => {
    const ids = (Array.isArray(orderIds) ? orderIds : [orderIds]).filter(Boolean)
    if (!ids.length) return
    if (!window.confirm(`Cancel ${ids.length} order(s)? Stock will be restored.`)) return
    try {
      await cancelOrders.mutateAsync({ orderIds: ids })
      toast.success('Orders cancelled')
      setSelectedOrders([])
      refreshList()
    } catch (err) {
      toast.error(err?.message || 'Could not cancel orders')
    }
  }

  const runBulkMutation = async (label, fn) => {
    if (!selectedOrders.length) return
    setBulkBusy(true)
    try {
      const data = await fn(selectedOrders)
      const summaryText = data?.summary
        ? `Success: ${data.summary.success ?? 0}, Failed: ${data.summary.failed ?? 0}`
        : label
      toast.success(summaryText)
      setSelectedOrders([])
      setShowBulkMenu(false)
      setShowPickupPanel(false)
      refreshList()
    } catch (err) {
      toast.error(err?.message || `${label} failed`)
    } finally {
      setBulkBusy(false)
    }
  }

  const handleShipNow = () => runBulkMutation('Ship now', (ids) => shipNow.mutateAsync(ids))
  const handleSyncShiprocket = () => {
    if (!window.confirm(`Refresh Shiprocket for ${selectedOrders.length} order(s)?`)) return
    runBulkMutation('Shiprocket sync', (ids) => syncShiprocket.mutateAsync(ids))
  }
  const handleSchedulePickup = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
      toast.error('Choose a valid pickup date')
      return
    }
    runBulkMutation('Pickup scheduled', (ids) =>
      schedulePickup.mutateAsync({ orderIds: ids, pickupDate })
    )
  }

  const runZipDownload = async (mutation, label) => {
    if (!selectedOrders.length) return
    setBulkBusy(true)
    try {
      await mutation.mutateAsync(selectedOrders)
      toast.success(`${label} downloaded`)
      setShowBulkMenu(false)
    } catch (err) {
      toast.error(err?.message || `${label} failed`)
    } finally {
      setBulkBusy(false)
    }
  }

  const handleDownloadReport = () => {
    const rows = orders.map((o) => ({
      id: o.orderIdDisplay || o.orderId || o.id,
      contact: o.contactPhone || '',
      date: formatDateTime(o.createdAt),
      amount: formatInr(o.amountInr ?? o.totalAmount),
      status: o.fulfillmentLabel || o.orderStatus || '',
      items: o.itemCount ?? '',
      payment: o.paymentLabel || '',
    }))
    const header = 'Order ID,Contact,Date,Amount,Status,Items,Payment'
    const csv =
      'data:text/csv;charset=utf-8,' +
      header +
      '\n' +
      rows
        .map((o) =>
          [o.id, o.contact, o.date, o.amount, o.status, o.items, o.payment]
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csv))
    link.setAttribute('download', 'Orders_Report.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const allSelected = orders.length > 0 && selectedOrders.length === orders.length
  const bulkPending = bulkBusy || confirmOrders.isPending || cancelOrders.isPending || shipNow.isPending

  if (viewMode === 'detail' && selectedOrderId) {
    return (
      <AdminOrderDetailView
        orderId={selectedOrderId}
        order={orderDetail}
        loading={detailLoading}
        error={detailIsError ? detailError : null}
        onBack={() => {
          setViewMode('list')
          setSelectedOrderId(null)
          refreshList()
        }}
        onOrderRefresh={async () => {
          await refetchDetail()
          await refetch()
          await refetchSummary()
        }}
      />
    )
  }

  // List view

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Operations" title="Orders">
        <div className="admin-toolbar" style={{ marginBottom: 0 }}>
          <Button variant="secondary" size="sm" onClick={handleDownloadReport}>
            <Download size={14} /> Order report
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={syncStatuses.isPending}
            onClick={async () => {
              try {
                await syncStatuses.mutateAsync({})
                toast.success('Statuses synced')
                refreshList()
              } catch (err) {
                toast.error(err?.message || 'Sync failed')
              }
            }}
          >
            {syncStatuses.isPending ? 'Syncing…' : 'Sync statuses'}
          </Button>
        </div>
      </AdminPageHeader>

      <div className="admin-metric-grid admin-metric-grid--orders">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="admin-metric-card">
            <div>
              <p className="admin-metric-card__label">{stat.label}</p>
              <p className="admin-metric-card__value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-orders-filters">
        <div className="admin-tabs admin-tabs--scroll">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              className={`admin-tabs__btn${bucket === tab.label ? ' is-active' : ''}`}
              onClick={() => {
                setBucket(tab.label)
                setPage(1)
                setSelectedOrderId(null)
                setSelectedOrders([])
              }}
            >
              {tab.label}
              <span className="admin-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

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
            placeholder="Search order ID, AWB, phone…"
            aria-label="Search orders"
          />
          <Button type="submit" variant="secondary" size="sm">Search</Button>
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                setSearchInput('')
                setPage(1)
              }}
            >
              Clear
            </Button>
          )}
        </form>
      </div>

      {selectedOrders.length > 0 && (
        <div className="admin-bulk-bar admin-bulk-bar--orders">
          <span>{selectedOrders.length} selected</span>
          <div className="admin-row-actions">
            {bucket === 'Pending' && (
              <>
                <Button variant="primary" size="sm" disabled={bulkPending} onClick={() => handleConfirm(selectedOrders)}>
                  Accept selected
                </Button>
                <Button variant="secondary" size="sm" disabled={bulkPending} onClick={() => handleCancel(selectedOrders)}>
                  Cancel selected
                </Button>
              </>
            )}
            {(bucket === 'Confirmed' || bucket === 'Ready to Ship') && (
              <Button variant="primary" size="sm" disabled={bulkPending} onClick={handleShipNow}>
                Ship now
              </Button>
            )}
            <div className="admin-bulk-menu">
              <Button
                variant="secondary"
                size="sm"
                disabled={bulkPending}
                onClick={() => setShowBulkMenu((v) => !v)}
              >
                Bulk actions <ChevronDown size={14} />
              </Button>
              {showBulkMenu && (
                <div className="admin-bulk-menu__panel">
                  <button type="button" disabled={bulkPending} onClick={() => handleSyncShiprocket()}>
                    Refresh Shiprocket
                  </button>
                  <button type="button" disabled={bulkPending} onClick={() => { setShowPickupPanel(true); setShowBulkMenu(false) }}>
                    Schedule pickup
                  </button>
                  <button type="button" disabled={bulkPending} onClick={() => runZipDownload(taxInvoicesZip, 'Tax invoices ZIP')}>
                    Tax invoices (ZIP)
                  </button>
                  <button type="button" disabled={bulkPending} onClick={() => runZipDownload(shippingLabelsZip, 'Shipping labels ZIP')}>
                    Shipping labels (ZIP)
                  </button>
                  <button type="button" disabled={bulkPending} onClick={() => runZipDownload(manifestsZip, 'Manifests ZIP')}>
                    Shiprocket manifests (ZIP)
                  </button>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedOrders([])}>Clear</Button>
          </div>
        </div>
      )}

      {showPickupPanel && selectedOrders.length > 0 && (
        <div className="admin-card admin-pickup-panel">
          <strong>Schedule pickup</strong>
          <div className="admin-row-actions">
            <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
            <Button variant="primary" size="sm" disabled={bulkPending} onClick={handleSchedulePickup}>
              Confirm pickup
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowPickupPanel(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="admin-orders-layout admin-orders-layout--table">
        <section className="admin-card admin-card--flush">
          {isLoading && <AdminLoading label="Loading orders…" />}
          {isError && <AdminError message={error?.message} onRetry={refetch} />}
          {!isLoading && !isError && orders.length === 0 && (
            <AdminEmpty message={`No orders in ${bucket}.`} />
          )}
          {!isLoading && orders.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table admin-orders-table">
                <thead>
                  <tr>
                    <th className="admin-orders-table__check">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all orders"
                      />
                    </th>
                    <th>Order ID</th>
                    <th>Contact</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Courier & Ops</th>
                    <th>Action</th>
                    <th>Items</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const id = order.orderId || order.id || order._id
                    const active = String(selectedOrderId) === String(id)
                    const checked = selectedOrders.includes(id)
                    const provider = providerLabel(order)
                    const paymentLabel = order.paymentLabel || order.paymentStatus || '—'
                    const amount = order.amountInr ?? order.totalAmount ?? order.amountPayable ?? 0

                    return (
                      <tr
                        key={id}
                        className={active ? 'is-active' : ''}
                        onClick={() => {
                          setSelectedOrderId(id)
                          setViewMode('detail')
                        }}
                      >
                        <td
                          className="admin-orders-table__check"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelectOrder(id)}
                            aria-label={`Select order ${id}`}
                          />
                        </td>
                        <td>
                          <div className="admin-order-id">
                            <strong>{order.orderIdDisplay || id}</strong>
                            {provider && (
                              <span
                                className={`admin-provider-badge${
                                  String(order.shippingProvider).toLowerCase() === 'shipmozo'
                                    ? ' admin-provider-badge--shipmozo'
                                    : ''
                                }`}
                              >
                                {provider}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{order.contactPhone || order.phone || '—'}</td>
                        <td className="admin-orders-table__muted">
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td className="admin-orders-table__amount">{formatInr(amount)}</td>
                        <td>
                          <span className="admin-badge">
                            {order.fulfillmentLabel || order.orderStatus || order.status || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-courier-cell">
                            <strong>{order.courierOpsLine1 || '—'}</strong>
                            {order.courierOpsLine2 ? <span>{order.courierOpsLine2}</span> : null}
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {bucket === 'Pending' ? (
                            <div className="admin-row-actions">
                              <div className="admin-split-button">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={confirmOrders.isPending}
                                  onClick={() => handleConfirm([id])}
                                  className="admin-split-button__main"
                                >
                                  Accept
                                </Button>
                                <ActionMenu
                                  trigger={
                                    <button
                                      type="button"
                                      className="admin-split-button__dropdown"
                                      disabled={confirmOrders.isPending}
                                      aria-label="More actions"
                                    >
                                      <ChevronDown size={14} />
                                    </button>
                                  }
                                  items={[
                                    {
                                      label: 'Reject',
                                      onClick: () => handleCancel([id]),
                                    },
                                    {
                                      label: 'Open order',
                                      onClick: () => {
                                        setSelectedOrderId(id)
                                        setViewMode('detail')
                                      },
                                    },
                                  ]}
                                />
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrderId(id)
                                setViewMode('detail')
                              }}
                            >
                              View
                            </Button>
                          )}
                        </td>
                        <td className="admin-orders-table__center">
                          {order.itemCount ?? order.items?.length ?? '—'}
                        </td>
                        <td className="admin-orders-table__center">
                          <span className={`admin-payment-label admin-payment-label--${paymentTone(paymentLabel)}`}>
                            {paymentLabel}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <AdminPagination
            page={page}
            totalPages={pagination?.totalPages}
            onPageChange={setPage}
          />
          {pagination?.total != null && (
            <p className="admin-orders-footer">
              Page {page} of {pagination.totalPages || 1} · {pagination.total} orders
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
