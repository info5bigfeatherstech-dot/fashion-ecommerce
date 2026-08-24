import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  AdminTable,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import { AdminFreeShippingOfferModal } from '@/features/admin/components/AdminFreeShippingOfferModal'
import {
  useAdminFreeShippingOffers,
  useDeleteAdminFreeShippingOffer,
  useToggleAdminFreeShippingOffer,
} from '@/features/admin/hooks'

export default function AdminOffersPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingOffer, setEditingOffer] = useState(null)

  const { data, isLoading, isError, error, refetch } = useAdminFreeShippingOffers({
    page,
    status,
    search,
  })

  const toggle = useToggleAdminFreeShippingOffer()
  const deleteOffer = useDeleteAdminFreeShippingOffer()

  const { items: offers, pagination } = useMemo(
    () => extractListPayload(data, ['offers']),
    [data]
  )

  const handleToggle = async (id) => {
    try {
      await toggle.mutateAsync(id)
      toast.success('Offer updated')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not update offer')
    }
  }

  const handleDelete = async (offer) => {
    const id = offer?._id || offer?.id
    if (!id) return
    if (!window.confirm(`Delete free shipping offer "${offer?.name || id}"?`)) return
    try {
      await deleteOffer.mutateAsync(id)
      toast.success('Offer deleted')
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not delete offer')
    }
  }

  const totalPages = pagination?.totalPages || pagination?.pages || null

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Marketing"
        title="Free Shipping Offers"
      >
        <div className="admin-row-actions" style={{ marginTop: 16 }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingOffer(null)
              setShowModal(true)
            }}
          >
            <Plus size={14} /> Create offer
          </Button>
        </div>
      </AdminPageHeader>

      <div className="admin-tabs">
        {['all', 'active', 'inactive'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`admin-tabs__btn${status === tab ? ' is-active' : ''}`}
            onClick={() => {
              setStatus(tab)
              setPage(1)
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-card admin-card--flush" style={{ marginTop: 12 }}>
        {isLoading && <AdminLoading />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}

        {!isLoading && offers.length === 0 && <AdminEmpty message="No offers found." />}

        {!isLoading && offers.length > 0 && (
          <>
            <AdminTable
              columns={[
                { key: 'name', label: 'Offer', render: (r) => r?.name || '—' },
                {
                  key: 'minCartValue',
                  label: 'Min cart',
                  render: (r) => (r?.minCartValue != null ? `₹${r.minCartValue}` : '—'),
                },
                {
                  key: 'endDate',
                  label: 'Expiry',
                  render: (r) => {
                    if (!r?.endDate) return 'No expiry'
                    const d = new Date(r.endDate)
                    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
                  },
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (r) => (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span
                        className={`admin-badge${r?.isActive === false ? ' admin-badge--warn' : ' admin-badge--success'}`}
                      >
                        {r?.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                      {r?.isLive && (
                        <span className="admin-badge admin-badge--success">Live</span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'actions',
                  label: '',
                  render: (r) => (
                    <div className="admin-row-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(r?._id || r?.id)}
                      >
                        Toggle
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Edit"
                        onClick={() => {
                          setEditingOffer(r)
                          setShowModal(true)
                        }}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Delete"
                        onClick={() => handleDelete(r)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ),
                },
              ]}
              rows={offers}
              getRowKey={(r) => r?._id || r?.id}
            />

            <AdminPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}

        <div style={{ marginTop: 16 }}>
          {/* Minimal search (optional). Wired to API; can be enhanced later. */}
          <label className="body-sm text-muted" style={{ display: 'block', marginBottom: 6 }}>
            Search
          </label>
          <input
            className="input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search offers…"
          />
        </div>
      </div>

      <AdminFreeShippingOfferModal
        open={showModal}
        onOpenChange={setShowModal}
        offer={editingOffer}
        onSaved={() => refetch()}
      />
    </div>
  )
}

