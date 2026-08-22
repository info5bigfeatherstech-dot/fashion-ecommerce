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
import { useAdminStaff, useAdminStaffProfile, useDeleteAdminStaff } from '@/features/admin/hooks'
import { Button } from '@/components/ui/Button'
import { ADMIN_ROLE_LABELS } from '@/features/admin/store'

export default function AdminStaffPage() {
  const [page, setPage] = useState(1)
  const { data: profile } = useAdminStaffProfile()
  const { data, isLoading, isError, error, refetch } = useAdminStaff({ page })
  const deleteStaff = useDeleteAdminStaff()

  const staffPayload = data?.staff ? data : { staff: data }
  const { items: staff, pagination } = useMemo(
    () => extractListPayload(staffPayload, ['staff']),
    [data]
  )

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this staff member?')) return
    try {
      await deleteStaff.mutateAsync(id)
      toast.success('Staff removed')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Team" title="Staff" />
      {profile && (
        <div className="admin-card">
          <h2 className="admin-card__title">Your profile</h2>
          <p className="body-sm">{profile.name || profile.email}</p>
          <p className="body-sm text-muted">{ADMIN_ROLE_LABELS[profile.role] || profile.role}</p>
        </div>
      )}
      <div className="admin-card admin-card--flush">
        {isLoading && <AdminLoading />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}
        {!isLoading && staff.length === 0 && <AdminEmpty message="No staff members." />}
        {!isLoading && staff.length > 0 && (
          <AdminTable
            columns={[
              { key: 'name', label: 'Name', render: (r) => r.name || '—' },
              { key: 'email', label: 'Email', render: (r) => r.email || '—' },
              { key: 'role', label: 'Role', render: (r) => ADMIN_ROLE_LABELS[r.role] || r.role || '—' },
              {
                key: 'actions',
                label: '',
                render: (r) => (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(r._id || r.id)}>
                    Remove
                  </Button>
                ),
              },
            ]}
            rows={staff}
            getRowKey={(r) => r._id || r.id}
          />
        )}
        <AdminPagination page={page} totalPages={pagination?.totalPages || data?.pagination?.totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
