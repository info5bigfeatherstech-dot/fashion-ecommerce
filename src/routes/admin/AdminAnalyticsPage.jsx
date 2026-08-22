import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminStatRow,
} from '@/features/admin/components/AdminUi'
import {
  useAdminProductsActiveCount,
  useAdminProductsLowStock,
  useAdminDashboardSummary,
} from '@/features/admin/hooks'

export default function AdminAnalyticsPage() {
  const { data: dashboard, isLoading: dashLoading, isError: dashError } = useAdminDashboardSummary()
  const { data: activeCount } = useAdminProductsActiveCount()
  const { data: lowStock, isLoading: stockLoading } = useAdminProductsLowStock()

  if (dashLoading || stockLoading) return <AdminLoading label="Loading analytics…" />
  if (dashError) return <AdminError message="Could not load analytics" />

  const lowStockList = Array.isArray(lowStock)
    ? lowStock
    : (lowStock?.products || lowStock?.items || [])

  const stats = [
    { label: 'Active products', value: activeCount?.count ?? activeCount?.active ?? '—' },
    { label: 'Low stock SKUs', value: lowStockList.length || lowStock?.count || '—' },
    { label: 'Total users', value: dashboard?.totalUsers ?? '—' },
    { label: 'Wishlists', value: dashboard?.wishlists?.total ?? dashboard?.totalWishlists ?? '—' },
  ]

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Insights" title="Store analytics">
        <AdminStatRow stats={stats} />
      </AdminPageHeader>

      {lowStockList.length > 0 && (
        <div className="admin-card">
          <h2 className="admin-card__title">Low stock products</h2>
          <ul className="admin-item-list">
            {lowStockList.slice(0, 20).map((p) => (
              <li key={p._id || p.slug || p.id} className="admin-item-row">
                <span>{p.name || p.slug}</span>
                <span className="admin-badge admin-badge--warn">Stock: {p.stock ?? p.quantity ?? '—'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
