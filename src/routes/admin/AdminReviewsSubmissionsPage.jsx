import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Package,
  Power,
  RefreshCw,
  Search,
  Star,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  AdminTable,
} from '@/features/admin/components/AdminUi'
import {
  getAdminProductReviews,
  patchAdminProductReviewStatus,
} from '@/features/admin/api/reviews'

function StarRatingDisplay({ value }) {
  const num = Math.max(0, Math.min(5, Number(value) || 0))
  return (
    <div className="admin-rev-rating">
      <div className="admin-rev-stars" aria-label={`${num} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={13}
            fill={i <= num ? '#f59e0b' : 'none'}
            stroke={i <= num ? '#f59e0b' : '#cbd5e1'}
            strokeWidth={1.5}
            aria-hidden
          />
        ))}
        <span>{num.toFixed(1)}</span>
      </div>
    </div>
  )
}

function CustomerAvatar({ name }) {
  const initials = (name || 'C')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'C'
  return <div className="admin-rev-avatar">{initials}</div>
}

export default function AdminReviewsSubmissionsPage() {
  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'live' | 'hidden'
  const [ratingFilter, setRatingFilter] = useState(0) // 0 = all
  const [searchQuery, setSearchQuery] = useState('')
  const [previewPhoto, setPreviewPhoto] = useState(null)

  const fetchReviews = useCallback(
    async (targetPage = page) => {
      setLoading(true)
      setError(null)
      try {
        const isActiveParam =
          statusFilter === 'live' ? true : statusFilter === 'hidden' ? false : undefined

        const res = await getAdminProductReviews({
          source: 'customer',
          page: targetPage,
          limit: 20,
          isActive: isActiveParam,
        })

        if (res?.success === false) {
          setError(res?.message || 'Could not load customer submissions')
          return
        }

        const rawList = res?.reviews || []
        setReviews(rawList)
        setPagination({
          page: res?.pagination?.page || targetPage,
          limit: res?.pagination?.limit || 20,
          total: res?.pagination?.total ?? rawList.length,
          pages: res?.pagination?.pages || Math.max(1, Math.ceil((res?.pagination?.total || rawList.length) / 20)),
        })
      } catch (err) {
        setError(err?.message || 'Network error loading reviews')
      } finally {
        setLoading(false)
      }
    },
    [page, statusFilter]
  )

  useEffect(() => {
    fetchReviews(page)
  }, [fetchReviews, page])

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status)
    setPage(1)
  }

  // Toggle active status (publish / moderate)
  const handleToggleStatus = async (review) => {
    const nextStatus = !review.isActive
    const id = review._id
    if (busyId === id) return

    setBusyId(id)
    try {
      const res = await patchAdminProductReviewStatus(id, { isActive: nextStatus })
      if (res?.success === false) {
        toast.error(res?.message || 'Failed to update review status')
        return
      }

      setReviews((prev) =>
        prev.map((r) => (r._id === id ? { ...r, isActive: nextStatus } : r))
      )
      toast.success(nextStatus ? 'Review is now live on storefront' : 'Review hidden from storefront')
    } catch (err) {
      toast.error(err?.message || 'Failed to update review status')
    } finally {
      setBusyId(null)
    }
  }

  // Filtered reviews
  const displayedReviews = useMemo(() => {
    let list = reviews

    if (ratingFilter > 0) {
      list = list.filter((r) => Math.round(Number(r.rating)) === ratingFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((r) => {
        const author = (r.customer?.name || r.displayName || '').toLowerCase()
        const email = (r.customer?.email || '').toLowerCase()
        const comment = (r.comment || '').toLowerCase()
        const productTitle = (r.product?.title || '').toLowerCase()
        const order = (r.orderId || '').toLowerCase()
        return (
          author.includes(q) ||
          email.includes(q) ||
          comment.includes(q) ||
          productTitle.includes(q) ||
          order.includes(q)
        )
      })
    }

    return list
  }, [reviews, ratingFilter, searchQuery])

  const liveCount = reviews.filter((r) => r.isActive).length
  const hiddenCount = reviews.filter((r) => !r.isActive).length

  // Table Columns
  const columns = useMemo(
    () => [
      {
        key: 'customer',
        label: 'Customer',
        render: (r) => {
          const name = r.customer?.name || r.displayName || 'Customer'
          const email = r.customer?.email || ''
          const phone = r.customer?.phone || ''
          return (
            <div className="admin-rev-customer">
              <CustomerAvatar name={name} />
              <div className="admin-rev-customer__meta">
                <div className="admin-rev-customer__name-row">
                  <strong className="admin-rev-customer__name">{name}</strong>
                  {r.verifiedPurchase && (
                    <span className="admin-badge admin-badge--success" title="Delivered Verified Purchase">
                      <CheckCircle2 size={10} style={{ marginRight: '3px' }} /> Verified
                    </span>
                  )}
                </div>
                {email && <span className="admin-rev-customer__sub">{email}</span>}
                {phone && <span className="admin-rev-customer__sub">{phone}</span>}
                {r.orderId && (
                  <span className="admin-rev-customer__order">
                    Order #{r.orderId}
                  </span>
                )}
              </div>
            </div>
          )
        },
      },
      {
        key: 'rating',
        label: 'Rating',
        render: (r) => (
          <div className="admin-rev-rating">
            <StarRatingDisplay value={r.rating} />
            <span className="admin-rev-date">
              {r.createdAt
                ? new Date(r.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'review',
        label: 'Feedback & Photos',
        render: (r) => {
          const images = Array.isArray(r.images) ? r.images : []
          return (
            <div>
              {r.comment ? (
                <p className="admin-rev-comment">"{r.comment}"</p>
              ) : (
                <p className="admin-rev-comment text-muted italic">No written comment</p>
              )}

              {images.length > 0 && (
                <div className="admin-rev-photos">
                  {images.map((img, idx) => {
                    const url = img?.url || img?.secure_url || img
                    if (!url) return null
                    return (
                      <button
                        key={idx}
                        type="button"
                        className="admin-rev-photo-btn"
                        onClick={() => setPreviewPhoto(url)}
                        title="Click to view photo"
                      >
                        <img src={url} alt="" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        },
      },
      {
        key: 'product',
        label: 'Product',
        render: (r) => {
          const p = r.product
          if (!p) return <span className="text-muted text-xs">—</span>
          return (
            <div className="admin-rev-product">
              <div className="admin-rev-product__thumb">
                {p.thumb ? (
                  <img src={p.thumb} alt={p.title || ''} />
                ) : (
                  <Package size={16} className="text-muted" />
                )}
              </div>
              <div className="admin-rev-product__info">
                <p className="admin-rev-product__title" title={p.title}>
                  {p.title}
                </p>
                {p.slug && (
                  <Link
                    to={`/product/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-rev-product__link"
                  >
                    View PDP <ExternalLink size={10} />
                  </Link>
                )}
              </div>
            </div>
          )
        },
      },
      {
        key: 'status',
        label: 'Status & Visibility',
        render: (r) => {
          const active = r.isActive !== false
          const busy = busyId === r._id
          return (
            <div className="admin-coupons__status-cell">
              <span
                className={`admin-badge${active ? ' admin-badge--success' : ' admin-badge--warn'}`}
              >
                {active ? 'Live' : 'Hidden'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                aria-label={active ? 'Hide review' : 'Publish review'}
                className={`admin-coupons__switch${active ? ' is-on' : ''}`}
                disabled={busy}
                onClick={() => handleToggleStatus(r)}
                title={active ? 'Hide from storefront' : 'Make live on storefront'}
              >
                <span className="admin-coupons__switch-thumb" aria-hidden />
                <Power size={11} className="admin-coupons__switch-icon" aria-hidden />
              </button>
            </div>
          )
        },
      },
    ],
    [busyId]
  )

  return (
    <div className="admin-page admin-reviews-submissions">
      {/* Top Header */}
      <AdminPageHeader eyebrow="Reviews" title="Customer Submissions">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchReviews(page)}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </AdminPageHeader>

      {/* Metric Stat Cards */}
      <div className="admin-reviews-stats">
        <div className="admin-reviews-stat-card">
          <span>Total Submissions</span>
          <strong>{pagination.total}</strong>
        </div>
        <div className="admin-reviews-stat-card">
          <span>Live on Storefront</span>
          <strong style={{ color: 'var(--color-success, #16a34a)' }}>{liveCount}</strong>
        </div>
        <div className="admin-reviews-stat-card">
          <span>Hidden / Pending</span>
          <strong style={{ color: 'var(--color-gold, #d1a743)' }}>{hiddenCount}</strong>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tabs__btn${statusFilter === 'all' ? ' is-active' : ''}`}
          onClick={() => handleStatusFilterChange('all')}
        >
          All ({pagination.total})
        </button>
        <button
          type="button"
          className={`admin-tabs__btn${statusFilter === 'live' ? ' is-active' : ''}`}
          onClick={() => handleStatusFilterChange('live')}
        >
          Live ({liveCount})
        </button>
        <button
          type="button"
          className={`admin-tabs__btn${statusFilter === 'hidden' ? ' is-active' : ''}`}
          onClick={() => handleStatusFilterChange('hidden')}
        >
          Hidden ({hiddenCount})
        </button>
      </div>

      {/* Toolbar: Search + Star Filter */}
      <div className="admin-reviews-toolbar">
        <div className="admin-reviews-toolbar__search">
          <Search size={15} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, comment, product, or order ID…"
          />
        </div>

        <div className="admin-reviews-toolbar__filters">
          <span className="admin-reviews-toolbar__label">Filter rating:</span>
          {[0, 5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              type="button"
              className={`admin-reviews-toolbar__star-btn${ratingFilter === s ? ' is-active' : ''}`}
              onClick={() => setRatingFilter(s)}
            >
              {s === 0 ? 'All' : `${s} ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="admin-card admin-card--flush">
        {loading && <AdminLoading label="Loading customer submissions…" />}
        {error && <AdminError message={error} onRetry={() => fetchReviews(page)} />}
        {!loading && !error && displayedReviews.length === 0 && (
          <AdminEmpty message="No customer submissions match your current filter." />
        )}
        {!loading && !error && displayedReviews.length > 0 && (
          <AdminTable
            columns={columns}
            rows={displayedReviews}
            getRowKey={(r) => r._id}
          />
        )}
      </div>

      {/* Pagination */}
      <AdminPagination
        page={page}
        totalPages={pagination.pages}
        onPageChange={(p) => setPage(p)}
      />

      {/* Lightbox Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="admin-gen-reviews__modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setPreviewPhoto(null)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            style={{
              position: 'relative',
              background: '#fff',
              borderRadius: '12px',
              padding: '16px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.65)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              <X size={16} />
            </button>
            <img
              src={previewPhoto}
              alt="Customer review attachment"
              style={{
                maxWidth: '82vw',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px',
                display: 'block',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
