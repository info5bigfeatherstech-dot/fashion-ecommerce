import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Download } from 'lucide-react'
import { toast } from 'sonner'
import { AdminOrderDetailView } from '@/features/admin/components/AdminOrderDetailView'
import {
  ORDER_TAB_ORDER,
  ORDER_TAB_LABEL_TO_BUCKET,
  isPostConfirmOrderStatus,
} from '@/features/admin/api/orders'
import {
  canAdminBulkCancelOrderRow,
  canAdminBulkConfirmOrderRow,
  canAdminBulkDownloadLabelOrderRow,
  canAdminBulkDownloadManifestOrderRow,
  canAdminBulkSchedulePickupOrderRow,
  canAdminBulkShipNowOrderRow,
  canAdminBulkSyncShiprocketOrderRow,
} from '@/features/admin/utils/adminOrderFulfillmentEligibility'
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

function toLocalYmd(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function localDateStrToStartIso(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const parts = dateStr.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null
  const [y, m, d] = parts
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0)
  if (Number.isNaN(dt.getTime())) return null
  return dt.toISOString()
}

function localDateStrToEndIso(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const parts = dateStr.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null
  const [y, m, d] = parts
  const dt = new Date(y, m - 1, d, 23, 59, 59, 999)
  if (Number.isNaN(dt.getTime())) return null
  return dt.toISOString()
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
  const [bulkInlineError, setBulkInlineError] = useState(null)
  const bulkMenuRef = useRef(null)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'detail'
  const [datePreset, setDatePreset] = useState('last30')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [draftDateFrom, setDraftDateFrom] = useState('')
  const [draftDateTo, setDraftDateTo] = useState('')
  const [customRangeError, setCustomRangeError] = useState(null)

  const searchActive = Boolean(String(search || '').trim())

  const dateQueryArgs = useMemo(() => {
    if (searchActive) return { rangePreset: 'all' }
    if (datePreset === 'custom') {
      const fromIso = localDateStrToStartIso(customDateFrom)
      const toIso = localDateStrToEndIso(customDateTo)
      if (fromIso && toIso) return { from: fromIso, to: toIso }
      return { rangePreset: 'last30' }
    }
    if (datePreset === 'last7') return { rangePreset: 'last7' }
    if (datePreset === 'last30') return { rangePreset: 'last30' }
    return { rangePreset: 'last30' }
  }, [searchActive, datePreset, customDateFrom, customDateTo])

  const { data: summary, refetch: refetchSummary } = useAdminOrdersSummary()
  const { data: listData, isLoading, isError, error, refetch } = useAdminOrdersList({
    bucket,
    page,
    search,
    ...dateQueryArgs,
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

  const orderById = useMemo(
    () => new Map(orders.map((o) => [o.orderId || o.id || o._id, o])),
    [orders]
  )

  const showBulkPendingActions = bucket === 'Pending'
  const showBulkTaxInvoicesZip = bucket === 'Confirmed'

  const eligibleBulkConfirmIds = useMemo(
    () => selectedOrders.filter((id) => canAdminBulkConfirmOrderRow(orderById.get(id))),
    [selectedOrders, orderById]
  )
  const eligibleBulkPendingIds = useMemo(
    () => selectedOrders.filter((id) => canAdminBulkCancelOrderRow(orderById.get(id))),
    [selectedOrders, orderById]
  )
  const eligibleBulkShipIds = useMemo(
    () => selectedOrders.filter((id) => canAdminBulkShipNowOrderRow(orderById.get(id))),
    [selectedOrders, orderById]
  )
  const eligibleBulkPickupIds = useMemo(
    () => selectedOrders.filter((id) => canAdminBulkSchedulePickupOrderRow(orderById.get(id))),
    [selectedOrders, orderById]
  )
  const eligibleBulkSyncIds = useMemo(
    () => selectedOrders.filter((id) => canAdminBulkSyncShiprocketOrderRow(orderById.get(id))),
    [selectedOrders, orderById]
  )
  const eligibleBulkInvoiceIds = useMemo(
    () =>
      selectedOrders.filter((id) => {
        const o = orderById.get(id)
        return o && isPostConfirmOrderStatus(o.orderStatus)
      }),
    [selectedOrders, orderById]
  )
  const eligibleBulkManifestIds = useMemo(
    () => selectedOrders.filter((id) => canAdminBulkDownloadManifestOrderRow(orderById.get(id))),
    [selectedOrders, orderById]
  )
  const eligibleBulkLabelIds = useMemo(
    () => selectedOrders.filter((id) => canAdminBulkDownloadLabelOrderRow(orderById.get(id))),
    [selectedOrders, orderById]
  )

  useEffect(() => {
    setSelectedOrders([])
    setShowBulkMenu(false)
    setShowPickupPanel(false)
    setBulkInlineError(null)
  }, [bucket, page, search, datePreset, customDateFrom, customDateTo])

  useEffect(() => {
    if (!showBulkMenu) return undefined
    const onDocClick = (e) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target)) {
        setShowBulkMenu(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showBulkMenu])

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
    if (!ids.length) {
      setBulkInlineError('No eligible orders. Confirm needs Pending orders with payment ready.')
      return
    }
    setBulkInlineError(null)
    try {
      await confirmOrders.mutateAsync(ids)
      toast.success(ids.length > 1 ? `${ids.length} orders confirmed` : 'Order confirmed')
      setSelectedOrders([])
      setShowBulkMenu(false)
      refreshList()
    } catch (err) {
      toast.error(err?.message || 'Could not confirm order')
    }
  }

  const handleCancel = async (orderIds) => {
    const ids = (Array.isArray(orderIds) ? orderIds : [orderIds]).filter(Boolean)
    if (!ids.length) {
      setBulkInlineError('No eligible orders. Cancel applies to Pending orders only.')
      return
    }
    if (!window.confirm(`Cancel ${ids.length} order(s)? Stock will be restored.`)) return
    setBulkInlineError(null)
    try {
      await cancelOrders.mutateAsync({ orderIds: ids })
      toast.success('Orders cancelled')
      setSelectedOrders([])
      setShowBulkMenu(false)
      refreshList()
    } catch (err) {
      toast.error(err?.message || 'Could not cancel orders')
    }
  }

  const runBulkMutation = async (label, ids, fn) => {
    const orderIds = (Array.isArray(ids) ? ids : []).filter(Boolean)
    if (!orderIds.length) {
      setBulkInlineError(`No eligible orders for ${label}.`)
      return
    }
    setBulkBusy(true)
    setBulkInlineError(null)
    try {
      const data = await fn(orderIds)
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

  const handleShipNow = () =>
    runBulkMutation('Ship now', eligibleBulkShipIds, (ids) => shipNow.mutateAsync(ids))
  const handleSyncShiprocket = () => {
    if (!eligibleBulkSyncIds.length) {
      setBulkInlineError('No selected orders have a Shiprocket shipment to refresh.')
      return
    }
    if (!window.confirm(`Refresh Shiprocket for ${eligibleBulkSyncIds.length} order(s)?`)) return
    runBulkMutation('Shiprocket sync', eligibleBulkSyncIds, (ids) => syncShiprocket.mutateAsync(ids))
  }
  const handleSchedulePickup = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
      toast.error('Choose a valid pickup date')
      return
    }
    runBulkMutation('Pickup scheduled', eligibleBulkPickupIds, (ids) =>
      schedulePickup.mutateAsync({ orderIds: ids, pickupDate })
    )
  }

  const runZipDownload = async (mutation, label, ids) => {
    const orderIds = (Array.isArray(ids) ? ids : selectedOrders).filter(Boolean)
    if (!orderIds.length) {
      setBulkInlineError(`No eligible orders for ${label}.`)
      return
    }
    setBulkBusy(true)
    setBulkInlineError(null)
    try {
      await mutation.mutateAsync(orderIds)
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
  const bulkPending =
    bulkBusy ||
    confirmOrders.isPending ||
    cancelOrders.isPending ||
    shipNow.isPending ||
    schedulePickup.isPending ||
    syncShiprocket.isPending
  const noFulfillmentHint =
    !eligibleBulkShipIds.length &&
    !eligibleBulkSyncIds.length &&
    !eligibleBulkPickupIds.length &&
    !eligibleBulkManifestIds.length &&
    !eligibleBulkLabelIds.length

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
          <div className="admin-date-range">
            <select
              className="admin-date-range__select"
              value={datePreset}
              disabled={searchActive}
              title={
                searchActive
                  ? 'Date range paused while searching — clear search to filter by date'
                  : undefined
              }
              onChange={(e) => {
                const v = e.target.value
                setCustomRangeError(null)
                setPage(1)
                if (v === 'custom') {
                  const toD = new Date()
                  const fromD = new Date(toD.getTime() - 6 * 24 * 60 * 60 * 1000)
                  const toStr = toLocalYmd(toD)
                  const fromStr = toLocalYmd(fromD)
                  setDraftDateFrom(fromStr)
                  setDraftDateTo(toStr)
                  setCustomDateFrom(fromStr)
                  setCustomDateTo(toStr)
                  setDatePreset('custom')
                } else {
                  setDatePreset(v)
                  setCustomDateFrom('')
                  setCustomDateTo('')
                  setDraftDateFrom('')
                  setDraftDateTo('')
                }
              }}
            >
              <option value="last7">Last 7 days</option>
              <option value="last30">Last 30 days</option>
              <option value="custom">Custom</option>
            </select>
            {datePreset === 'custom' && !searchActive && (
              <div className="admin-date-range__custom">
                <label className="admin-date-range__label">
                  From
                  <input
                    type="date"
                    className="admin-date-range__input"
                    value={draftDateFrom}
                    onChange={(e) => setDraftDateFrom(e.target.value)}
                  />
                </label>
                <label className="admin-date-range__label">
                  To
                  <input
                    type="date"
                    className="admin-date-range__input"
                    value={draftDateTo}
                    onChange={(e) => setDraftDateTo(e.target.value)}
                  />
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setCustomRangeError(null)
                    if (!draftDateFrom || !draftDateTo) {
                      setCustomRangeError('Select both start and end dates.')
                      return
                    }
                    if (draftDateFrom > draftDateTo) {
                      setCustomRangeError('Start date must be on or before end date.')
                      return
                    }
                    const start = new Date(draftDateFrom)
                    const end = new Date(draftDateTo)
                    const maxMs = 366 * 24 * 60 * 60 * 1000
                    if (end - start > maxMs) {
                      setCustomRangeError('Range cannot exceed 366 days.')
                      return
                    }
                    setCustomDateFrom(draftDateFrom)
                    setCustomDateTo(draftDateTo)
                    setPage(1)
                  }}
                >
                  Apply
                </Button>
              </div>
            )}
            {customRangeError && (
              <p className="admin-date-range__error">{customRangeError}</p>
            )}
            {searchActive && (
              <p className="admin-date-range__hint">
                Searching all dates — clear search to use the date filter.
              </p>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={handleDownloadReport}>
            <Download size={14} /> Order report
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={syncStatuses.isPending}
            onClick={async () => {
              try {
                await syncStatuses.mutateAsync(dateQueryArgs)
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
          <div className="admin-bulk-bar__row">
            <div className="admin-bulk-menu" ref={bulkMenuRef}>
              <button
                type="button"
                className="admin-bulk-menu__trigger"
                disabled={bulkPending}
                onClick={() => {
                  setBulkInlineError(null)
                  setShowBulkMenu((v) => !v)
                }}
              >
                Bulk actions ▾
              </button>
              {showBulkMenu ? (
                <div className="admin-bulk-menu__panel" role="menu">
                  {showBulkPendingActions ? (
                    <>
                      <button
                        type="button"
                        className="admin-bulk-menu__item admin-bulk-menu__item--confirm"
                        disabled={bulkPending || !eligibleBulkConfirmIds.length}
                        title={
                          !eligibleBulkConfirmIds.length
                            ? 'Select Pending orders where payment is ready.'
                            : undefined
                        }
                        onClick={() => handleConfirm(eligibleBulkConfirmIds)}
                      >
                        Confirm order(s)
                      </button>
                      <button
                        type="button"
                        className="admin-bulk-menu__item admin-bulk-menu__item--cancel"
                        disabled={bulkPending || !eligibleBulkPendingIds.length}
                        title={
                          !eligibleBulkPendingIds.length
                            ? 'Select Pending orders to cancel.'
                            : undefined
                        }
                        onClick={() => handleCancel(eligibleBulkPendingIds)}
                      >
                        Cancel order(s)
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className={`admin-bulk-menu__item${showBulkPendingActions ? ' is-bordered' : ''}`}
                    disabled={bulkPending || !eligibleBulkShipIds.length}
                    title={
                      !eligibleBulkShipIds.length
                        ? 'No selected orders are ready for Ship now (needs Confirmed + no AWB).'
                        : undefined
                    }
                    onClick={handleShipNow}
                  >
                    Ship now (Shiprocket)
                  </button>
                  <button
                    type="button"
                    className="admin-bulk-menu__item is-bordered"
                    disabled={bulkPending || !eligibleBulkSyncIds.length}
                    title={
                      !eligibleBulkSyncIds.length
                        ? 'No selected orders have a Shiprocket shipment to refresh.'
                        : 'Sync status, pickup date, and SRPID from Shiprocket.'
                    }
                    onClick={handleSyncShiprocket}
                  >
                    Refresh Shiprocket (sync + SRPID)
                  </button>
                  <button
                    type="button"
                    className="admin-bulk-menu__item"
                    disabled={bulkPending || !eligibleBulkPickupIds.length}
                    title={
                      !eligibleBulkPickupIds.length
                        ? 'No selected orders need pickup scheduling (needs AWB, no pickup booked yet).'
                        : undefined
                    }
                    onClick={() => {
                      setShowPickupPanel(true)
                      setShowBulkMenu(false)
                    }}
                  >
                    Schedule pickup…
                  </button>
                  {showBulkTaxInvoicesZip ? (
                    <button
                      type="button"
                      className="admin-bulk-menu__item is-bordered"
                      disabled={bulkPending || !eligibleBulkInvoiceIds.length}
                      onClick={() =>
                        runZipDownload(taxInvoicesZip, 'Tax invoices ZIP', eligibleBulkInvoiceIds)
                      }
                    >
                      Bulk tax invoices (ZIP)
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="admin-bulk-menu__item is-bordered"
                    disabled={bulkPending || !eligibleBulkManifestIds.length}
                    title={
                      !eligibleBulkManifestIds.length
                        ? 'No selected orders can download manifest (needs AWB).'
                        : undefined
                    }
                    onClick={() =>
                      runZipDownload(manifestsZip, 'Shiprocket manifests ZIP', eligibleBulkManifestIds)
                    }
                  >
                    Bulk Shiprocket manifests (ZIP)
                  </button>
                  <button
                    type="button"
                    className="admin-bulk-menu__item"
                    disabled={bulkPending || !eligibleBulkLabelIds.length}
                    title={
                      !eligibleBulkLabelIds.length
                        ? 'No selected orders can download label (needs AWB).'
                        : undefined
                    }
                    onClick={() =>
                      runZipDownload(shippingLabelsZip, 'Shipping labels ZIP', eligibleBulkLabelIds)
                    }
                  >
                    Bulk shipping labels (ZIP)
                  </button>
                  {noFulfillmentHint ? (
                    <p className="admin-bulk-menu__hint">
                      No ship, pickup, manifest, or label actions apply to the current selection. Select
                      orders with Shiprocket shipments and use Refresh Shiprocket to load SRPID.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="admin-bulk-bar__summary">
              <p>
                <strong>{selectedOrders.length}</strong>{' '}
                {selectedOrders.length === 1 ? 'order selected' : 'orders selected'}. Tap{' '}
                <strong>Bulk actions</strong>, then pick an item from the menu.
              </p>
              <p className="admin-bulk-bar__counts">
                {showBulkPendingActions ? (
                  <>
                    Confirm (payment ready): <strong>{eligibleBulkConfirmIds.length}</strong>
                    {' · '}
                    Cancel (pending): <strong>{eligibleBulkPendingIds.length}</strong>
                    {' · '}
                  </>
                ) : null}
                Ready for ship: <strong>{eligibleBulkShipIds.length}</strong>
                {' · '}
                Refresh Shiprocket: <strong>{eligibleBulkSyncIds.length}</strong>
                {' · '}
                Ready for pickup: <strong>{eligibleBulkPickupIds.length}</strong>
                {showBulkTaxInvoicesZip ? (
                  <>
                    {' · '}
                    Tax invoice (ZIP): <strong>{eligibleBulkInvoiceIds.length}</strong>
                  </>
                ) : null}
                {' · '}
                Manifest (ZIP): <strong>{eligibleBulkManifestIds.length}</strong>
                {' · '}
                Shipping label (ZIP): <strong>{eligibleBulkLabelIds.length}</strong>
                {eligibleBulkShipIds.length === 0 && eligibleBulkPickupIds.length === 0 ? (
                  <span className="admin-bulk-bar__muted">
                    {' '}
                    — Ship / pickup not for these rows at this step.
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          {bulkInlineError ? (
            <div className="admin-bulk-bar__error" role="alert">
              {bulkInlineError}
            </div>
          ) : null}
        </div>
      )}

      {showPickupPanel && selectedOrders.length > 0 && (
        <div className="admin-card admin-pickup-panel">
          <strong>Schedule pickup</strong>
          <div className="admin-row-actions">
            <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
            <Button
              variant="primary"
              size="sm"
              disabled={bulkPending || !eligibleBulkPickupIds.length}
              onClick={handleSchedulePickup}
            >
              Confirm pickup ({eligibleBulkPickupIds.length})
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowPickupPanel(false)}>
              Cancel
            </Button>
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
