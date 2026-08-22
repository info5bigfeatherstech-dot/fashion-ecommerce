import { useMemo, useState } from 'react'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  AdminTable,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import { useAdminPopularWishlistProducts, useAdminWishlists } from '@/features/admin/hooks'

const VARIANTS = [
  { id: 'all', label: 'All wishlists' },
  { id: 'stale', label: 'Stale' },
]

export default function AdminWishlistsPage() {
  const [page, setPage] = useState(1)
  const [variant, setVariant] = useState('all')
  const { data, isLoading, isError, error, refetch } = useAdminWishlists({ variant, page })
  const { data: popular } = useAdminPopularWishlistProducts()
  const { items: wishlists, pagination } = useMemo(
    () => extractListPayload(data, ['wishlists']),
    [data]
  )

  const popularItems = Array.isArray(popular) ? popular : (popular?.products || [])

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Leads" title="Wishlists" />
      {popularItems.length > 0 && (
        <div className="admin-card">
          <h2 className="admin-card__title">Most wishlisted</h2>
          <ul className="admin-chip-list">
            {popularItems.slice(0, 8).map((p) => (
              <li key={p.productId || p.slug || p.name}>{p.name || p.slug} ({p.count ?? p.wishlistCount ?? 0})</li>
            ))}
          </ul>
        </div>
      )}
      <div className="admin-tabs">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`admin-tabs__btn${variant === v.id ? ' is-active' : ''}`}
            onClick={() => { setVariant(v.id); setPage(1) }}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="admin-card admin-card--flush">
        {isLoading && <AdminLoading />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}
        {!isLoading && wishlists.length === 0 && <AdminEmpty message="No wishlists found." />}
        {!isLoading && wishlists.length > 0 && (
          <AdminTable
            columns={[
              { key: 'user', label: 'Customer', render: (r) => r.userEmail || r.userName || '—' },
              { key: 'items', label: 'Items', render: (r) => r.itemCount ?? r.items?.length ?? '—' },
              {
                key: 'updated',
                label: 'Updated',
                render: (r) => (r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'),
              },
            ]}
            rows={wishlists}
            getRowKey={(r) => r._id || r.id}
          />
        )}
        <AdminPagination page={page} totalPages={pagination?.totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
