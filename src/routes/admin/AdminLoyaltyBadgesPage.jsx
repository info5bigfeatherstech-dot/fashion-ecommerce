import { useMemo, useState } from 'react'
import { Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminTable,
} from '@/features/admin/components/AdminUi'
import { AdminLoyaltyBadgeModal } from '@/features/admin/components/AdminLoyaltyBadgeModal'
import { AdminLoyaltyBadgeMembersModal } from '@/features/admin/components/AdminLoyaltyBadgeMembersModal'
import { AdminLoyaltyRecomputeModal } from '@/features/admin/components/AdminLoyaltyRecomputeModal'
import {
  deleteAdminLoyaltyBadge,
  getAdminLoyaltyBadges,
  toggleAdminLoyaltyBadge,
} from '@/features/admin/api/marketing'
import { useQuery } from '@tanstack/react-query'

const CRITERIA_LABEL = {
  spend: 'Spend',
  orders: 'Orders',
  spend_and_orders: 'Spend + Orders',
  spend_or_orders: 'Spend or Orders',
}

export default function AdminLoyaltyBadgesPage() {
  const [status, setStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [membersBadge, setMembersBadge] = useState(null)
  const [showRecompute, setShowRecompute] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'loyalty-badges', status],
    queryFn: ({ signal }) => getAdminLoyaltyBadges({ signal, status }),
  })

  const badges = useMemo(() => {
    const raw = data?.badges || data?.data?.badges || []
    return Array.isArray(raw) ? raw : []
  }, [data])

  const handleToggle = async (id) => {
    try {
      await toggleAdminLoyaltyBadge(id)
      toast.success('Badge updated')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not update badge')
    }
  }

  const handleDelete = async (badge) => {
    const id = badge?._id || badge?.id
    if (!id) return
    if (!window.confirm(`Delete loyalty badge "${badge?.name || id}"? Users will be reassigned on next order.`)) return
    try {
      await deleteAdminLoyaltyBadge(id)
      toast.success('Badge deleted')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not delete badge')
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Marketing" title="Loyalty badges">
        <div className="admin-row-actions" style={{ marginTop: 16 }}>
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowRecompute(true)}>
            <RefreshCw size={14} /> Assign / recompute customer
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditing(null)
              setShowModal(true)
            }}
          >
            <Plus size={14} /> Create badge
          </Button>
        </div>
      </AdminPageHeader>

      <p className="body-sm text-muted" style={{ marginTop: 0, maxWidth: 720 }}>
        Define Bronze / Silver / Gold by spend and/or order count. Rank <strong>1 = best</strong>{' '}
        (Gold), then 2, 3… Optional member caps (first N). Click members to see who holds each badge.
        If a paid order did not assign a badge, use Assign / recompute with the customer email.
      </p>

      <div className="admin-tabs">
        {['all', 'active', 'inactive'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`admin-tabs__btn${status === tab ? ' is-active' : ''}`}
            onClick={() => setStatus(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <AdminLoading />
      ) : isError ? (
        <AdminError message={error?.message || 'Failed to load badges'} onRetry={refetch} />
      ) : badges.length === 0 ? (
        <AdminEmpty message="No loyalty badges yet. Create Bronze, Silver, Gold — thresholds are fully editable." />
      ) : (
        <AdminTable
          getRowKey={(row) => row._id || row.id || row.slug}
          columns={[
            {
              key: 'name',
              label: 'Badge',
              render: (row) => (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span
                    aria-hidden
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: row.color || '#C9A227',
                      display: 'inline-block',
                    }}
                  />
                  <strong>{row.name}</strong>
                  <span className="text-muted">({row.slug})</span>
                </span>
              ),
            },
            {
              key: 'criteria',
              label: 'Criteria',
              render: (row) => (
                <span>
                  {CRITERIA_LABEL[row.criteriaMode] || row.criteriaMode}
                  {' · '}
                  ₹{Number(row.minLifetimeSpendInr || 0).toLocaleString('en-IN')}
                  {' / '}
                  {Number(row.minOrderCount || 0)} orders
                </span>
              ),
            },
            {
              key: 'members',
              label: 'Members',
              render: (row) => {
                const count = Number(row.memberCount) || 0
                const cap = row.maxMembers != null ? Number(row.maxMembers) : null
                return (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMembersBadge(row)}
                    title="View customers"
                  >
                    <Users size={14} />
                    {' '}
                    {count}
                    {cap != null ? ` / ${cap}` : ' · ∞'}
                  </Button>
                )
              },
            },
            { key: 'rank', label: 'Rank', render: (row) => row.rank },
            {
              key: 'status',
              label: 'Status',
              render: (row) => (row.isActive !== false ? 'Active' : 'Inactive'),
            },
            {
              key: 'actions',
              label: '',
              render: (row) => (
                <div className="admin-row-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(row)
                      setShowModal(true)
                    }}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleToggle(row._id || row.id)}>
                    {row.isActive !== false ? 'Disable' : 'Enable'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(row)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ),
            },
          ]}
          rows={badges}
        />
      )}

      <AdminLoyaltyBadgeModal
        open={showModal}
        onOpenChange={setShowModal}
        badge={editing}
        onSaved={() => refetch()}
      />

      <AdminLoyaltyBadgeMembersModal
        open={Boolean(membersBadge)}
        onOpenChange={(next) => {
          if (!next) setMembersBadge(null)
        }}
        badge={membersBadge}
      />

      <AdminLoyaltyRecomputeModal
        open={showRecompute}
        onOpenChange={setShowRecompute}
        onDone={() => refetch()}
      />
    </div>
  )
}
