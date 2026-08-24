import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPagination,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import { useAdminRtoAnalytics, useAdminRtoOrders } from '@/features/admin/hooks'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const RTO_SECTIONS = [
  { id: 'management', label: 'RTO Management', badge: null },
  { id: 'all-orders', label: 'All RTO Orders', badge: null },
  { id: 'customer-related', label: 'Customer Related RTO', badge: null },
  { id: 'courier-related', label: 'Courier Related RTO', badge: null },
  { id: 'fake-paid', label: 'Fake Paid RTO', badge: null },
  { id: 'refund-pending', label: 'Refund Pending', badge: null },
  { id: 'refund-processed', label: 'Refund Processed', badge: null },
  { id: 'refund-rejected', label: 'Refund Rejected', badge: null },
  { id: 'closed', label: 'Closed RTOs', badge: null },
  { id: 're-dispatch', label: 'Re-dispatch Requests', badge: 'soon', variant: 'warning' },
  { id: 'cod-restricted', label: 'COD-Restricted Customers', badge: 'soon', variant: 'warning' },
  { id: 'reports', label: 'RTO Reports', badge: null },
  { id: 'analytics', label: 'RTO Analytics', badge: null },
]

function RtoSidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="rto-sidebar">
      <div className="rto-sidebar-header">
        <h3 className="rto-sidebar-title">RTO</h3>
        <p className="rto-sidebar-subtitle">Manage orders</p>
      </div>
      <nav className="rto-sidebar-nav">
        {RTO_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`rto-sidebar-link${activeSection === section.id ? ' is-active' : ''}`}
            onClick={() => onSectionChange(section.id)}
          >
            <span>{section.label}</span>
            {section.badge && (
              <span className={`rto-sidebar-badge rto-sidebar-badge--${section.variant || 'default'}`}>
                {section.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  )
}

function RtoManagementSection({ analytics, orders, isLoading }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  const stats = [
    {
      label: 'TOTAL RTO',
      value: analytics?.total ?? analytics?.totalRto ?? 0,
      color: 'blue',
    },
    {
      label: 'PENDING',
      value: analytics?.pending ?? 0,
      color: 'yellow',
    },
    {
      label: 'RETURNED',
      value: analytics?.returned ?? 0,
      color: 'green',
    },
    {
      label: 'CLOSED',
      value: analytics?.closed ?? 0,
      color: 'gray',
    },
  ]

  return (
    <div className="rto-management">
      <div className="rto-management-header">
        <div className="rto-management-header-content">
          <h1 className="rto-management-title">RTO Management</h1>
          <p className="rto-management-subtitle">
            Manage orders returned to origin due to delivery failure
          </p>
        </div>
        <Button variant="ghost" size="sm">
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      <div className="rto-stats">
        {stats.map((stat) => (
          <div key={stat.label} className={`rto-stat rto-stat--${stat.color}`}>
            <div className="rto-stat-label">{stat.label}</div>
            <div className="rto-stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="rto-toolbar">
        <div className="rto-toolbar-left">
          <select
            className="rto-filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="returned">Returned</option>
            <option value="closed">Closed</option>
          </select>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID / phone / name / Shipcode ID..."
          />
        </div>
        <div className="rto-toolbar-right">
          <Button variant="secondary" size="sm">
            Apply
          </Button>
          <Button variant="ghost" size="sm">
            Bulk Refund
          </Button>
          <Button variant="ghost" size="sm">
            Bulk Close
          </Button>
        </div>
      </div>

      <div className="rto-table-container">
        {isLoading ? (
          <AdminLoading />
        ) : orders.length === 0 ? (
          <AdminEmpty message="No RTO orders found." />
        ) : (
          <table className="rto-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input type="checkbox" className="rto-checkbox" />
                </th>
                <th>ORDER ID</th>
                <th>CUSTOMER</th>
                <th>AMOUNT</th>
                <th>RTO STATUS</th>
                <th>SHIPCODE#</th>
                <th>REASON</th>
                <th>RETURNED</th>
                <th>REFUND</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId || order._id}>
                  <td>
                    <input type="checkbox" className="rto-checkbox" />
                  </td>
                  <td>
                    <span className="rto-order-id">{order.orderId || order.id || '—'}</span>
                  </td>
                  <td>
                    <div className="rto-customer">
                      <div className="rto-customer-name">
                        {order.customerName || order.userEmail || '—'}
                      </div>
                      <div className="rto-customer-email">{order.userEmail || ''}</div>
                    </div>
                  </td>
                  <td>
                    <span className="rto-amount">{formatPrice(order.totalAmount)}</span>
                  </td>
                  <td>
                    <span className={`rto-status-badge rto-status-badge--${order.rtoStatus || 'pending'}`}>
                      {order.rtoStatus || order.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <span className="rto-shipcode">{order.trackingNumber || '—'}</span>
                  </td>
                  <td>
                    <span className="rto-reason">{order.rtoReason || '—'}</span>
                  </td>
                  <td>
                    <span className="rto-date">
                      {order.returnedAt
                        ? new Date(order.returnedAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`rto-refund-status rto-refund-status--${order.refundStatus || 'pending'}`}>
                      {order.refundStatus || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div className="rto-actions">
                      <button type="button" className="rto-action-btn" title="View details">
                        👁️
                      </button>
                      <button type="button" className="rto-action-btn" title="Process refund">
                        💰
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function AdminRtoPage() {
  const [activeSection, setActiveSection] = useState('management')
  const [page, setPage] = useState(1)

  const { data: analytics } = useAdminRtoAnalytics()
  const { data, isLoading, isError, error, refetch } = useAdminRtoOrders({ page })
  const { items: orders, pagination } = useMemo(
    () => extractListPayload(data, ['orders']),
    [data]
  )

  return (
    <div className="rto-page">
      <RtoSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="rto-main">
        {isError && (
          <div className="admin-card">
            <AdminError message={error?.message} onRetry={refetch} />
          </div>
        )}
        {activeSection === 'management' && (
          <>
            <RtoManagementSection analytics={analytics} orders={orders} isLoading={isLoading} />
            {!isLoading && orders.length > 0 && (
              <div className="rto-pagination-container">
                <AdminPagination
                  page={page}
                  totalPages={pagination?.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
        {activeSection === 'all-orders' && (
          <div className="rto-section-placeholder">
            <h2>All RTO Orders</h2>
            <p>View all RTO orders across all statuses</p>
          </div>
        )}
        {activeSection === 'customer-related' && (
          <div className="rto-section-placeholder">
            <h2>Customer Related RTO</h2>
            <p>RTOs caused by customer actions (refused, not available, etc.)</p>
          </div>
        )}
        {activeSection === 'courier-related' && (
          <div className="rto-section-placeholder">
            <h2>Courier Related RTO</h2>
            <p>RTOs caused by courier issues (address not found, delivery failed, etc.)</p>
          </div>
        )}
        {activeSection === 'fake-paid' && (
          <div className="rto-section-placeholder">
            <h2>Fake Paid RTO</h2>
            <p>Orders marked as paid but payment verification failed</p>
          </div>
        )}
        {activeSection === 'refund-pending' && (
          <div className="rto-section-placeholder">
            <h2>Refund Pending</h2>
            <p>RTOs awaiting refund processing</p>
          </div>
        )}
        {activeSection === 'refund-processed' && (
          <div className="rto-section-placeholder">
            <h2>Refund Processed</h2>
            <p>RTOs with completed refunds</p>
          </div>
        )}
        {activeSection === 'refund-rejected' && (
          <div className="rto-section-placeholder">
            <h2>Refund Rejected</h2>
            <p>RTOs where refund requests were rejected</p>
          </div>
        )}
        {activeSection === 'closed' && (
          <div className="rto-section-placeholder">
            <h2>Closed RTOs</h2>
            <p>Completed RTO cases that have been closed</p>
          </div>
        )}
        {activeSection === 're-dispatch' && (
          <div className="rto-section-placeholder">
            <h2>Re-dispatch Requests</h2>
            <p className="rto-badge-soon">Coming Soon</p>
            <p>Manage requests for re-dispatching returned orders</p>
          </div>
        )}
        {activeSection === 'cod-restricted' && (
          <div className="rto-section-placeholder">
            <h2>COD-Restricted Customers</h2>
            <p className="rto-badge-soon">Coming Soon</p>
            <p>Customers restricted from COD orders due to multiple RTOs</p>
          </div>
        )}
        {activeSection === 'reports' && (
          <div className="rto-section-placeholder">
            <h2>RTO Reports</h2>
            <p>Generate and view RTO analytics reports</p>
          </div>
        )}
        {activeSection === 'analytics' && (
          <div className="rto-section-placeholder">
            <h2>RTO Analytics</h2>
            <p>Detailed analytics and insights on RTO patterns</p>
          </div>
        )}
      </main>
    </div>
  )
}
