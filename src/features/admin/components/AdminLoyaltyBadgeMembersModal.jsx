import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AdminLoading, AdminError, AdminEmpty } from '@/features/admin/components/AdminUi'
import { getAdminLoyaltyBadgeMembers } from '@/features/admin/api/marketing'

function formatInr(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function AdminLoyaltyBadgeMembersModal({ open, onOpenChange, badge }) {
  const badgeId = badge?._id || badge?.id
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [members, setMembers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    if (!open) return
    setPage(1)
    setSearch('')
    setSearchInput('')
  }, [open, badgeId])

  useEffect(() => {
    if (!open || !badgeId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getAdminLoyaltyBadgeMembers(badgeId, { page, limit: 20, search })
      .then((payload) => {
        if (cancelled) return
        setMembers(Array.isArray(payload?.members) ? payload.members : [])
        setPagination(payload?.pagination || null)
        setMeta(payload?.badge || null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.message || 'Failed to load members')
        setMembers([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, badgeId, page, search])

  const totalPages = pagination?.totalPages || 1
  const total = pagination?.total ?? meta?.memberCount ?? 0
  const maxMembers = meta?.maxMembers ?? badge?.maxMembers
  const subtitle = [
    `${total} customer${total === 1 ? '' : 's'}`,
    maxMembers != null ? `cap ${maxMembers}` : 'unlimited',
    meta?.seatsRemaining != null ? `${meta.seatsRemaining} seats left` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`${badge?.name || 'Badge'} members`}
      subtitle={subtitle}
      className="modal-content--wide"
    >
      <div className="admin-loyalty-members">
        <form
          className="admin-loyalty-members__search"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            setSearch(searchInput.trim())
          }}
        >
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email, phone"
            aria-label="Search members"
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        {loading ? (
          <AdminLoading />
        ) : error ? (
          <AdminError message={error} />
        ) : members.length === 0 ? (
          <AdminEmpty message="No customers hold this badge yet." />
        ) : (
          <div className="admin-loyalty-members__list" role="list">
            {members.map((m) => (
              <article key={m.id || m._id} className="admin-loyalty-members__row" role="listitem">
                <div className="admin-loyalty-members__identity">
                  <strong>{m.name || '—'}</strong>
                  <span className="body-sm text-muted">{m.email || m.phone || '—'}</span>
                </div>
                <dl className="admin-loyalty-members__stats">
                  <div>
                    <dt>Spend</dt>
                    <dd>{formatInr(m.lifetimeSpendInr)}</dd>
                  </div>
                  <div>
                    <dt>Orders</dt>
                    <dd>{m.lifetimeOrderCount ?? 0}</dd>
                  </div>
                  <div>
                    <dt>Granted</dt>
                    <dd>{formatDate(m.badgeGrantedAt)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="admin-loyalty-members__pager">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="body-sm text-muted">
              Page {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}

        <div className="admin-form-actions">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
