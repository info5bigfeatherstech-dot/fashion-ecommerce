import { useState, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate, Navigate, Link } from 'react-router-dom'
import {
  RefreshCw,
  RotateCw,
  ShieldAlert,
  ArrowLeft,
  Truck,
  FileSpreadsheet,
  BarChart3,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AdminPagination, AdminLoading, AdminError } from '@/features/admin/components/AdminUi'
import {
  useRtoAuth,
  useRtoOrders,
  useRtoAnalytics,
  useRtoActions,
} from '@/hooks/useRtoData'
import { RtoAnalyticsCards } from '@/components/admin/rto/RtoAnalyticsCards'
import { RtoFilters } from '@/components/admin/rto/RtoFilters'
import { RtoOrdersTable } from '@/components/admin/rto/RtoOrdersTable'
import { RtoActionPanel } from '@/components/admin/rto/RtoActionPanel'
import { RtoBulkActionsBar } from '@/components/admin/rto/RtoBulkActionsBar'

const RTO_SIDEBAR_NAV = [
  { id: 'all', label: 'RTO Management', section: 'all' },
  { id: 'customer_related', label: 'Customer Related RTO', section: 'customer_related' },
  { id: 'courier_related', label: 'Courier Related RTO', section: 'courier_related' },
  { id: 'partial_paid', label: 'Partial Paid RTO', section: 'partial_paid' },
  { id: 'refund_pending', label: 'Refund Pending', section: 'refund_pending', status: 'pending' },
  { id: 'refund_processed', label: 'Refund Processed', section: 'refund_processed', status: 'refunded' },
  { id: 'refund_rejected', label: 'Refund Rejected', section: 'refund_rejected', status: 'refund_rejected' },
  { id: 'closed', label: 'Closed RTOs', section: 'closed', status: 'closed' },
  { id: 'analytics_view', label: 'Analytics Insights', isSpecial: 'analytics' },
  { id: 'reports_view', label: 'Export Reports', isSpecial: 'reports' },
]

export function RtoManagementPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // 1. Role and Authentication Check
  const { authReady, isAuthenticated, isAuthorized, role } = useRtoAuth()

  // 2. Query state mapped to URL search params
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || 'all'
  const section = searchParams.get('section') || 'all'
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  const activeTab = searchParams.get('tab') || 'all'

  // 3. Component state
  const [selectedOrderIds, setSelectedOrderIds] = useState([])
  const [inspectingOrder, setInspectingOrder] = useState(null)

  // 4. Data Fetching Hooks
  const {
    orders,
    pagination,
    summaryCounts,
    isLoading: ordersLoading,
    isFetching: ordersFetching,
    isError: ordersError,
    error: ordersErrObj,
    refetch: refetchOrders,
  } = useRtoOrders({
    page,
    limit: 20,
    search,
    status,
    section,
    sortBy,
    sortOrder,
    enabled: isAuthenticated && isAuthorized,
  })

  const {
    analytics,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useRtoAnalytics({
    enabled: isAuthenticated && isAuthorized,
  })

  // 5. Actions Hook
  const {
    autoSync,
    isSyncing,
    refundOrder,
    isRefunding,
    rejectOrder,
    isRejecting,
    bulkAction,
    isBulkActing,
    exportReport,
  } = useRtoActions()

  // 6. URL Param Updater
  const updateParams = useCallback(
    (updates) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(updates).forEach(([key, val]) => {
          if (val === undefined || val === null || val === '' || val === 'all') {
            next.delete(key)
          } else {
            next.set(key, String(val))
          }
        })
        return next
      })
    },
    [setSearchParams]
  )

  // Handlers
  const handlePageChange = (newPage) => {
    updateParams({ page: newPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearchChange = (newSearch) => {
    updateParams({ search: newSearch, page: 1 })
  }

  const handleStatusChange = (newStatus) => {
    updateParams({ status: newStatus, page: 1 })
  }

  const handleSectionChange = (newSection) => {
    updateParams({ section: newSection, page: 1 })
  }

  const handleSortChange = (newSortBy, newSortOrder) => {
    updateParams({ sortBy: newSortBy, sortOrder: newSortOrder, page: 1 })
  }

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  const handleSelectOrder = (id) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    const allIds = orders.map((o) => String(o.orderId || o.id || o._id))
    const isAllSelected = allIds.every((id) => selectedOrderIds.includes(id))
    if (isAllSelected) {
      setSelectedOrderIds([])
    } else {
      setSelectedOrderIds(allIds)
    }
  }

  const handleSidebarClick = (item) => {
    if (item.isSpecial === 'analytics') {
      updateParams({ tab: 'analytics', page: 1 })
    } else if (item.isSpecial === 'reports') {
      updateParams({ tab: 'reports', page: 1 })
    } else {
      updateParams({
        tab: item.id,
        section: item.section || 'all',
        status: item.status || 'all',
        page: 1,
      })
    }
  }

  const handleRefresh = () => {
    refetchOrders()
    refetchAnalytics()
  }

  // 7. Render Auth Checks
  if (authReady && !isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  if (authReady && isAuthenticated && !isAuthorized) {
    return (
      <div className="rto-access-denied">
        <div className="rto-access-denied__card">
          <ShieldAlert size={48} className="text-rose-600 mb-3" />
          <h2 className="display-sm text-ink mb-2">Access Denied</h2>
          <p className="body-md text-muted mb-4 max-w-md">
            The RTO Management module requires <strong>admin</strong> or{' '}
            <strong>order_manager</strong> credentials. Your current role (
            <code>{role || 'unknown'}</code>) does not have sufficient access.
          </p>
          <Button variant="secondary" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft size={16} /> Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rto-page">
      {/* Left Sidebar */}
      <aside className="rto-sidebar">
        <div className="rto-sidebar-header">
          <div className="flex items-center gap-2 mb-1">
            <Truck size={20} className="text-accent" />
            <h3 className="rto-sidebar-title">RTO Module</h3>
          </div>
          <p className="rto-sidebar-subtitle">Returns to Origin</p>
        </div>
        <nav className="rto-sidebar-nav">
          {RTO_SIDEBAR_NAV.map((item) => {
            const isActive = activeTab === item.id || (activeTab === 'all' && item.id === 'all')
            return (
              <button
                key={item.id}
                type="button"
                className={`rto-sidebar-link${isActive ? ' is-active' : ''}`}
                onClick={() => handleSidebarClick(item)}
              >
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="rto-main">
        {/* Page Header */}
        <div className="rto-management-header">
          <div>
            <h1 className="rto-management-title">RTO Management</h1>
            <p className="rto-management-subtitle">
              Inspect, track, synchronize statuses, and disburse refunds for delivery failure orders
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={ordersFetching || isSyncing}
              title="Refresh data"
            >
              <RefreshCw size={14} className={ordersFetching ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => autoSync()}
              disabled={isSyncing}
            >
              <RotateCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing...' : 'Auto-Sync'}
            </Button>
          </div>
        </div>

        {/* Analytics Dashboard (KPIs + Trend Chart) */}
        <RtoAnalyticsCards analytics={analytics} isLoading={analyticsLoading} />

        {/* Error notification banner if any */}
        {ordersError && (
          <div className="mb-4">
            <AdminError message={ordersErrObj?.message} onRetry={refetchOrders} />
          </div>
        )}

        {/* Filter Toolbar & Summary Tabs */}
        <RtoFilters
          search={search}
          status={status}
          section={section}
          sortBy={sortBy}
          sortOrder={sortOrder}
          summaryCounts={summaryCounts}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onSectionChange={handleSectionChange}
          onSortChange={handleSortChange}
          onResetFilters={handleResetFilters}
          onAutoSync={() => autoSync()}
          isSyncing={isSyncing}
          onExportReport={(fmt) =>
            exportReport({ status, section, search, format: fmt })
          }
        />

        {/* RTO Orders Table */}
        <RtoOrdersTable
          orders={orders}
          isLoading={ordersLoading}
          selectedOrderIds={selectedOrderIds}
          onSelectOrder={handleSelectOrder}
          onSelectAll={handleSelectAll}
          onViewOrder={(order) => setInspectingOrder(order)}
        />

        {/* Pagination */}
        {!ordersLoading && orders.length > 0 && (
          <div className="rto-pagination-container">
            <AdminPagination
              page={page}
              totalPages={pagination?.totalPages || 1}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </main>

      {/* Slide-over Inspection & Action Panel */}
      <RtoActionPanel
        order={inspectingOrder}
        isOpen={Boolean(inspectingOrder)}
        onClose={() => setInspectingOrder(null)}
        onRefund={async (params) => {
          await refundOrder(params)
          setInspectingOrder(null)
        }}
        onReject={async (params) => {
          await rejectOrder(params)
          setInspectingOrder(null)
        }}
        onCloseCase={async (orderId) => {
          await bulkAction({ action: 'close', orderIds: [orderId] })
          setInspectingOrder(null)
        }}
        isRefunding={isRefunding}
        isRejecting={isRejecting}
      />

      {/* Floating Multi-Select Bulk Actions Bar */}
      <RtoBulkActionsBar
        selectedOrderIds={selectedOrderIds}
        onClearSelection={() => setSelectedOrderIds([])}
        onBulkAction={bulkAction}
        isExecuting={isBulkActing}
      />
    </div>
  )
}

export default RtoManagementPage
