import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
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
import { useAdminUsers, useExportAdminUsers } from '@/features/admin/hooks'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading, isError, error, refetch } = useAdminUsers({ page, search })
  const exportUsers = useExportAdminUsers()
  const { items: users, pagination } = useMemo(
    () => extractListPayload(data, ['users', 'data']),
    [data]
  )

  const handleExport = async () => {
    try {
      await exportUsers.mutateAsync({ search })
      toast.success('Customers exported')
    } catch (err) {
      toast.error(err?.message || 'Export failed')
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Leads" title="Customers">
        <Button variant="secondary" size="sm" onClick={handleExport} disabled={exportUsers.isPending}>
          <Download size={14} /> {exportUsers.isPending ? 'Exporting…' : 'Export Excel'}
        </Button>
      </AdminPageHeader>
      <form
        className="admin-toolbar"
        onSubmit={(e) => {
          e.preventDefault()
          setSearch(searchInput.trim())
          setPage(1)
        }}
      >
        <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name, email, phone…" />
        <Button type="submit" variant="secondary" size="sm">Search</Button>
      </form>
      <div className="admin-card admin-card--flush">
        {isLoading && <AdminLoading />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}
        {!isLoading && users.length === 0 && <AdminEmpty message="No customers found." />}
        {!isLoading && users.length > 0 && (
          <AdminTable
            columns={[
              { key: 'name', label: 'Name', render: (r) => r.name || '—' },
              { key: 'email', label: 'Email', render: (r) => r.email || '—' },
              { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
              { key: 'role', label: 'Role', render: (r) => r.role || 'user' },
              {
                key: 'joined',
                label: 'Joined',
                render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'),
              },
            ]}
            rows={users}
            getRowKey={(r) => r._id || r.id}
          />
        )}
        <AdminPagination page={page} totalPages={pagination?.totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
