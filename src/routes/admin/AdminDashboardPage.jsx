import { AdminPageHeader, AdminLoading, AdminError, AdminStatRow } from '@/features/admin/components/AdminUi'
import { useAdminDashboardSummary, useAdminOrdersSummary, useAdminProductsActiveCount } from '@/features/admin/hooks'

export default function AdminDashboardPage() {
  const { data: dashboard, isLoading: dashLoading, isError: dashError } = useAdminDashboardSummary()
  const { data: ordersSummary } = useAdminOrdersSummary()
  const { data: activeProducts } = useAdminProductsActiveCount()

  if (dashLoading) return <AdminLoading label="Loading dashboard…" />
  if (dashError) return <AdminError message="Could not load dashboard" />

  const totals = ordersSummary?.totals || ordersSummary?.buckets || {}
  const dash = dashboard || {}

  const stats = [
    { label: 'Pending orders', value: totals.pending ?? totals.Pending ?? '—' },
    { label: 'Confirmed', value: totals.confirmed ?? totals.Confirmed ?? '—' },
    { label: 'Delivered', value: totals.delivered ?? totals.Delivered ?? '—' },
    { label: 'Active products', value: activeProducts?.count ?? activeProducts?.active ?? '—' },
    { label: 'Total users', value: dash.totalUsers ?? dash.users?.total ?? '—' },
    { label: 'Abandoned carts', value: dash.abandonedCarts ?? dash.carts?.abandoned ?? '—' },
  ]

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Overview" title="Dashboard">
        <AdminStatRow stats={stats.slice(0, 3)} />
      </AdminPageHeader>
      <div className="admin-dashboard-grid">
        <div className="admin-card">
          <h2 className="admin-card__title">Orders</h2>
          <AdminStatRow stats={stats.slice(0, 3)} />
        </div>
        <div className="admin-card">
          <h2 className="admin-card__title">Catalog & leads</h2>
          <AdminStatRow stats={stats.slice(3)} />
        </div>
      </div>
    </div>
  )
}
