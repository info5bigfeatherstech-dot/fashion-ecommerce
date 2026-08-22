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
import { useAdminOosInquiries, useUpdateAdminOosInquiryStatus } from '@/features/admin/hooks'
import { Button } from '@/components/ui/Button'

export default function AdminOutOfStockPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const { data, isLoading, isError, error, refetch } = useAdminOosInquiries({ page, status })
  const updateStatus = useUpdateAdminOosInquiryStatus()

  const { items: inquiries, pagination } = useMemo(
    () => extractListPayload(data, ['data', 'inquiries']),
    [data]
  )

  const markContacted = async (id) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'contacted' })
      toast.success('Marked as contacted')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Update failed')
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Catalog" title="Out of stock inquiries" />
      <div className="admin-tabs">
        {['all', 'pending', 'contacted', 'resolved'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`admin-tabs__btn${status === tab ? ' is-active' : ''}`}
            onClick={() => { setStatus(tab); setPage(1) }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      <div className="admin-card admin-card--flush">
        {isLoading && <AdminLoading />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}
        {!isLoading && inquiries.length === 0 && <AdminEmpty message="No inquiries." />}
        {!isLoading && inquiries.length > 0 && (
          <AdminTable
            columns={[
              { key: 'product', label: 'Product', render: (r) => r.productName || r.productSlug || '—' },
              { key: 'email', label: 'Email', render: (r) => r.email || r.userEmail || '—' },
              { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
              { key: 'status', label: 'Status', render: (r) => r.status || 'pending' },
              {
                key: 'actions',
                label: '',
                render: (r) => (
                  <Button variant="ghost" size="sm" onClick={() => markContacted(r.id || r._id)}>
                    Mark contacted
                  </Button>
                ),
              },
            ]}
            rows={inquiries}
            getRowKey={(r) => r.id || r._id}
          />
        )}
        <AdminPagination page={page} totalPages={pagination?.totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
