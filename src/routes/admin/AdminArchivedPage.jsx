import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  AdminTable,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import { useAdminProductsArchived, useHardDeleteAdminProduct, useRestoreAdminProduct } from '@/features/admin/hooks'
import { Button } from '@/components/ui/Button'

export default function AdminArchivedPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useAdminProductsArchived({ page })
  const restore = useRestoreAdminProduct()
  const hardDelete = useHardDeleteAdminProduct()

  const { items: products, pagination } = useMemo(
    () => extractListPayload(data, ['products']),
    [data]
  )

  const handleRestore = async (slug) => {
    try {
      await restore.mutateAsync(slug)
      toast.success('Product restored — it will appear on the Products page')
    } catch (err) {
      toast.error(err?.message || 'Restore failed')
      refetch()
    }
  }

  const handleDelete = async (slug) => {
    if (!window.confirm('Permanently delete this product?')) return
    try {
      await hardDelete.mutateAsync(slug)
      toast.success('Product deleted')
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
      refetch()
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Catalog" title="Archived products" />
      <div className="admin-card admin-card--flush">
        {isLoading && <AdminLoading />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}
        {!isLoading && products.length === 0 && <AdminEmpty message="No archived products." />}
        {!isLoading && products.length > 0 && (
          <AdminTable
            columns={[
              { key: 'name', label: 'Product', render: (r) => r.name || r.title || '—' },
              { key: 'slug', label: 'Slug', render: (r) => r.slug || '—' },
              {
                key: 'actions',
                label: 'Actions',
                render: (r) => (
                  <div className="admin-row-actions">
                    <Button variant="secondary" size="sm" onClick={() => handleRestore(r.slug)}>
                      Restore
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(r.slug)}>
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
            rows={products}
            getRowKey={(r) => r._id || r.slug}
          />
        )}
        <AdminPagination page={page} totalPages={pagination?.totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
