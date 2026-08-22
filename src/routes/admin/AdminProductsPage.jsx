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
import { useAdminProductsAll } from '@/features/admin/hooks'
import { formatPrice } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function AdminProductsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading, isError, error, refetch } = useAdminProductsAll({ page, search })
  const { items: products, pagination } = useMemo(
    () => extractListPayload(data, ['products']),
    [data]
  )

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Catalog" title="Products" />

      <form
        className="admin-toolbar"
        onSubmit={(e) => {
          e.preventDefault()
          setSearch(searchInput.trim())
          setPage(1)
        }}
      >
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search products…"
        />
        <Button type="submit" variant="secondary" size="sm">Search</Button>
      </form>

      <div className="admin-card admin-card--flush">
        {isLoading && <AdminLoading label="Loading products…" />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}
        {!isLoading && !isError && products.length === 0 && <AdminEmpty message="No products found." />}
        {!isLoading && products.length > 0 && (
          <AdminTable
            columns={[
              { key: 'name', label: 'Product', render: (r) => r.name || r.title || '—' },
              { key: 'sku', label: 'SKU', render: (r) => r.sku || r.slug || '—' },
              { key: 'price', label: 'Price', render: (r) => formatPrice(r.price ?? r.basePrice) },
              { key: 'stock', label: 'Stock', render: (r) => r.stock ?? r.quantity ?? '—' },
              {
                key: 'status',
                label: 'Status',
                render: (r) => (
                  <span className={`admin-badge${r.isActive === false ? ' admin-badge--warn' : ''}`}>
                    {r.isActive === false ? 'Inactive' : (r.status || 'Active')}
                  </span>
                ),
              },
            ]}
            rows={products}
            getRowKey={(r) => r._id || r.id || r.slug}
          />
        )}
        <AdminPagination page={page} totalPages={pagination?.totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
