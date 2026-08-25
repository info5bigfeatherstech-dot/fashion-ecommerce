import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2, Package, Pencil, Plus, Star, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  createAdminGeneratedReview,
  deleteAdminGeneratedReview,
  getAdminProductReviews,
  patchAdminProductReviewStatus,
  resolveAdminProductByVariantCode,
  updateAdminGeneratedReview,
} from '@/features/admin/api/reviews'

function defaultCreateForm() {
  return {
    productCode: '',
    rating: 5,
    comment: '',
    displayName: '',
    isActive: true,
  }
}

function StarDisplay({ value, size = 14 }) {
  return (
    <div className="admin-gen-reviews__stars" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= value ? '#f59e0b' : 'none'}
          stroke={i <= value ? '#f59e0b' : '#e2e8f0'}
          strokeWidth={1.5}
          aria-hidden
        />
      ))}
    </div>
  )
}

function StarRatingInput({ value, onChange, disabled = false, size = 26 }) {
  return (
    <div className="admin-gen-reviews__rating-input" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          disabled={disabled}
          className="admin-gen-reviews__star-btn"
          onClick={() => onChange(i)}
        >
          <Star
            size={size}
            fill={i <= value ? '#f59e0b' : 'none'}
            stroke={i <= value ? '#f59e0b' : '#cbd5e1'}
            strokeWidth={1.5}
            aria-hidden
          />
        </button>
      ))}
    </div>
  )
}

function Avatar({ name }) {
  const initials = (name || 'C')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const tones = ['violet', 'blue', 'emerald', 'amber', 'pink']
  const tone = tones[(name?.charCodeAt(0) || 0) % tones.length]
  return (
    <span className={`admin-gen-reviews__avatar admin-gen-reviews__avatar--${tone}`} aria-hidden>
      {initials}
    </span>
  )
}

function StatusPill({ active }) {
  return (
    <span className={`admin-gen-reviews__status${active ? ' is-live' : ''}`}>
      <span className="admin-gen-reviews__status-dot" aria-hidden />
      {active ? 'Live' : 'Hidden'}
    </span>
  )
}

function Toggle({ checked, onChange, id }) {
  return (
    <label className="admin-gen-reviews__toggle" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className={`admin-gen-reviews__toggle-track${checked ? ' is-on' : ''}`} aria-hidden>
        <span className="admin-gen-reviews__toggle-thumb" />
      </span>
    </label>
  )
}

function FieldLabel({ children, optional = false }) {
  return (
    <label className="admin-gen-reviews__label">
      {children}
      {optional ? <span className="admin-gen-reviews__optional">optional</span> : null}
    </label>
  )
}

export default function AdminReviewsGeneratedPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 0, limit: 20 })
  const [form, setForm] = useState(defaultCreateForm)
  const [resolvedProduct, setResolvedProduct] = useState(null)
  const [resolveMeta, setResolveMeta] = useState({ status: 'idle', message: '' })
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminProductReviews({ page, limit: 20, source: 'admin' })
      if (res?.success === false) throw new Error(res?.message || 'Failed to load')
      setReviews(Array.isArray(res?.reviews) ? res.reviews : [])
      setPagination(res?.pagination || { total: 0, pages: 0, limit: 20 })
    } catch (err) {
      toast.error(err?.message || 'Could not load reviews')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const raw = form.productCode.trim()
    if (!raw) {
      setResolvedProduct(null)
      setResolveMeta({ status: 'idle', message: '' })
      return undefined
    }
    const timer = setTimeout(async () => {
      const code = raw.toUpperCase()
      setResolvedProduct(null)
      setResolveMeta({ status: 'loading', message: '' })
      try {
        const res = await resolveAdminProductByVariantCode(code)
        if (res?.success === false || !res?.product?._id) {
          throw new Error(res?.message || 'Not found')
        }
        const p = res.product
        const v = res.variant || {}
        const thumb = Array.isArray(v.images) && v.images[0]?.url ? v.images[0].url : null
        setResolvedProduct({
          id: String(p._id),
          title: p.title || p.name || '—',
          slug: p.slug || '',
          thumb,
          productCode: res.matchedProductCode || code,
        })
        setResolveMeta({ status: 'ok', message: '' })
      } catch (err) {
        setResolvedProduct(null)
        setResolveMeta({ status: 'error', message: err?.message || 'No product found' })
      }
    }, 450)
    return () => clearTimeout(timer)
  }, [form.productCode])

  const createReview = async (e) => {
    e.preventDefault()
    if (!resolvedProduct?.id || resolveMeta.status === 'loading') {
      toast.error('Enter a valid product code and wait for the preview.')
      return
    }
    setSaving(true)
    try {
      const res = await createAdminGeneratedReview({
        productId: resolvedProduct.id,
        rating: Number(form.rating),
        comment: form.comment.trim(),
        displayName: form.displayName.trim(),
        isActive: Boolean(form.isActive),
      })
      if (res?.success === false) throw new Error(res?.message || 'Create failed')
      toast.success('Review created')
      setForm(defaultCreateForm())
      setResolvedProduct(null)
      setResolveMeta({ status: 'idle', message: '' })
      setPage(1)
      await load()
    } catch (err) {
      toast.error(err?.message || 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editing?._id) return
    setSaving(true)
    try {
      const res = await updateAdminGeneratedReview(editing._id, {
        rating: Number(editing.rating),
        comment: String(editing.comment || '').trim(),
        displayName: String(editing.displayName || '').trim(),
        isActive: Boolean(editing.isActive),
      })
      if (res?.success === false) throw new Error(res?.message || 'Update failed')
      toast.success('Review updated')
      setEditing(null)
      await load()
    } catch (err) {
      toast.error(err?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Permanently delete this review?')) return
    setBusyId(id)
    try {
      await deleteAdminGeneratedReview(id)
      toast.success('Deleted')
      await load()
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  const toggleQuick = async (row, next) => {
    setBusyId(row._id)
    try {
      await patchAdminProductReviewStatus(row._id, { isActive: next })
      toast.success(next ? 'Review is now live' : 'Review hidden')
      await load()
    } catch (err) {
      toast.error(err?.message || 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  const total = pagination.total ?? reviews.length

  return (
    <div className="admin-page admin-gen-reviews">
      <header className="admin-gen-reviews__head">
        <div className="admin-gen-reviews__title-wrap">
          <div className="admin-gen-reviews__badge" aria-hidden>
            <Star size={15} fill="#f59e0b" stroke="#f59e0b" />
          </div>
          <div>
            <h1 className="admin-gen-reviews__title">Generated Reviews</h1>
            <p className="admin-gen-reviews__subtitle">
              Curated storefront reviews — toggle visibility anytime
            </p>
          </div>
        </div>
        <div className="admin-gen-reviews__count">
          <Star size={15} fill="#f59e0b" stroke="#f59e0b" aria-hidden />
          <strong>{total}</strong>
          <span>reviews</span>
        </div>
      </header>

      <div className="admin-gen-reviews__layout">
        <section className="admin-gen-reviews__card admin-gen-reviews__form-card">
          <div className="admin-gen-reviews__card-head">
            <p className="admin-gen-reviews__card-title">Create Review</p>
            <p className="admin-gen-reviews__card-sub">Attach a review to any product</p>
          </div>

          <form onSubmit={createReview} className="admin-gen-reviews__form">
            <div>
              <FieldLabel>Product Code</FieldLabel>
              <div className="admin-gen-reviews__code-wrap">
                <input
                  required
                  value={form.productCode}
                  onChange={(e) => setForm((f) => ({ ...f, productCode: e.target.value }))}
                  className="admin-gen-reviews__input admin-gen-reviews__input--code"
                  placeholder="E.G. 4321-01"
                  autoComplete="off"
                />
                {resolveMeta.status === 'loading' ? (
                  <Loader2 size={14} className="admin-gen-reviews__code-status is-spin" aria-hidden />
                ) : null}
                {resolveMeta.status === 'ok' ? (
                  <Check size={14} className="admin-gen-reviews__code-status is-ok" aria-hidden />
                ) : null}
              </div>

              {resolveMeta.status === 'loading' && form.productCode.trim() ? (
                <p className="admin-gen-reviews__hint">Looking up…</p>
              ) : null}

              {resolveMeta.status === 'error' && form.productCode.trim() ? (
                <div className="admin-gen-reviews__alert admin-gen-reviews__alert--error">
                  {resolveMeta.message}
                </div>
              ) : null}

              {resolveMeta.status === 'ok' && resolvedProduct ? (
                <div className="admin-gen-reviews__product-hit">
                  {resolvedProduct.thumb ? (
                    <img src={resolvedProduct.thumb} alt="" />
                  ) : (
                    <span className="admin-gen-reviews__product-hit-empty" aria-hidden>
                      <Package size={14} />
                    </span>
                  )}
                  <div>
                    <strong>{resolvedProduct.title}</strong>
                    <span>{resolvedProduct.productCode}</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="admin-gen-reviews__rule" />

            <div>
              <FieldLabel>Rating</FieldLabel>
              <StarRatingInput
                value={form.rating}
                onChange={(n) => setForm((f) => ({ ...f, rating: n }))}
                disabled={saving}
              />
            </div>

            <div>
              <FieldLabel optional>Display Name</FieldLabel>
              <input
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                className="admin-gen-reviews__input"
                placeholder="e.g. Priya S."
              />
            </div>

            <div>
              <FieldLabel optional>Comment</FieldLabel>
              <textarea
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                rows={3}
                className="admin-gen-reviews__input admin-gen-reviews__textarea"
                placeholder="Write review text here..."
              />
            </div>

            <div className="admin-gen-reviews__rule" />

            <div className="admin-gen-reviews__visibility">
              <div>
                <p>Visible on storefront</p>
                <span>Customers see this immediately</span>
              </div>
              <Toggle
                id="gen-review-visible"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
            </div>

            <button
              type="submit"
              className="admin-gen-reviews__submit"
              disabled={saving || resolveMeta.status === 'loading' || !resolvedProduct?.id}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="is-spin" /> Saving…
                </>
              ) : (
                <>
                  <Plus size={14} /> Create Review
                </>
              )}
            </button>
          </form>
        </section>

        <section className="admin-gen-reviews__card admin-gen-reviews__list-card">
          <div className="admin-gen-reviews__card-head admin-gen-reviews__list-head">
            <div>
              <p className="admin-gen-reviews__card-title">All Reviews</p>
              {!loading && reviews.length > 0 ? (
                <p className="admin-gen-reviews__card-sub">
                  Showing {reviews.length} of {pagination.total}
                </p>
              ) : null}
            </div>
            {!loading && reviews.length > 0 && pagination.pages > 1 ? (
              <span className="admin-gen-reviews__page-chip">
                {page} / {pagination.pages}
              </span>
            ) : null}
          </div>

          {loading ? (
            <div className="admin-gen-reviews__loading">
              <Loader2 size={16} className="is-spin" /> Loading reviews…
            </div>
          ) : reviews.length === 0 ? (
            <div className="admin-gen-reviews__empty">
              <div className="admin-gen-reviews__empty-icon" aria-hidden>
                <Star size={24} stroke="#cbd5e1" />
              </div>
              <p className="admin-gen-reviews__empty-title">No reviews yet</p>
              <p className="admin-gen-reviews__empty-sub">
                Create your first curated review using the form on the left.
              </p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table admin-gen-reviews__table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Reviewer</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th className="admin-gen-reviews__center">Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <strong className="admin-gen-reviews__product-name">
                          {r.product?.title || '—'}
                        </strong>
                      </td>
                      <td>
                        <div className="admin-gen-reviews__reviewer">
                          <Avatar name={r.displayName} />
                          <span>{r.displayName || 'Customer'}</span>
                        </div>
                      </td>
                      <td>
                        <StarDisplay value={r.rating} />
                        <span className="admin-gen-reviews__rating-meta">{r.rating} / 5</span>
                      </td>
                      <td>
                        {r.comment ? (
                          <span className="admin-gen-reviews__comment">“{r.comment}”</span>
                        ) : (
                          <span className="admin-gen-reviews__comment-empty">No comment</span>
                        )}
                      </td>
                      <td className="admin-gen-reviews__center">
                        <button
                          type="button"
                          className="admin-gen-reviews__status-btn"
                          disabled={busyId === r._id}
                          onClick={() => toggleQuick(r, !r.isActive)}
                        >
                          <StatusPill active={r.isActive} />
                        </button>
                      </td>
                      <td>
                        <div className="admin-gen-reviews__row-actions">
                          <button
                            type="button"
                            onClick={() =>
                              setEditing({
                                _id: r._id,
                                rating: r.rating,
                                comment: r.comment || '',
                                displayName: r.displayName || '',
                                isActive: r.isActive,
                              })
                            }
                          >
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            type="button"
                            className="is-danger"
                            disabled={busyId === r._id}
                            onClick={() => remove(r._id)}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 ? (
            <div className="admin-gen-reviews__pager">
              <span>
                Page <strong>{page}</strong> of {pagination.pages}
              </span>
              <div className="admin-gen-reviews__pager-btns">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.pages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {editing ? (
        <div
          className="admin-gen-reviews__modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <div className="admin-gen-reviews__modal" role="dialog" aria-modal="true" aria-label="Edit Review">
            <div className="admin-gen-reviews__modal-head">
              <div>
                <h3>Edit Review</h3>
                <p>Changes are reflected on storefront immediately</p>
              </div>
              <button type="button" className="admin-gen-reviews__modal-close" onClick={() => setEditing(null)} aria-label="Close">
                <X size={13} />
              </button>
            </div>
            <form onSubmit={saveEdit} className="admin-gen-reviews__form">
              <div>
                <FieldLabel>Rating</FieldLabel>
                <StarRatingInput
                  value={editing.rating}
                  onChange={(n) => setEditing((x) => ({ ...x, rating: n }))}
                  disabled={saving}
                />
              </div>
              <div>
                <FieldLabel>Display Name</FieldLabel>
                <input
                  value={editing.displayName}
                  onChange={(e) => setEditing((x) => ({ ...x, displayName: e.target.value }))}
                  className="admin-gen-reviews__input"
                  placeholder="Customer"
                />
              </div>
              <div>
                <FieldLabel>Comment</FieldLabel>
                <textarea
                  value={editing.comment}
                  onChange={(e) => setEditing((x) => ({ ...x, comment: e.target.value }))}
                  rows={3}
                  className="admin-gen-reviews__input admin-gen-reviews__textarea"
                />
              </div>
              <div className="admin-gen-reviews__rule" />
              <div className="admin-gen-reviews__visibility">
                <div>
                  <p>Visible on storefront</p>
                  <span>Toggle customer visibility</span>
                </div>
                <Toggle
                  id="edit-review-visible"
                  checked={editing.isActive}
                  onChange={(e) => setEditing((x) => ({ ...x, isActive: e.target.checked }))}
                />
              </div>
              <div className="admin-gen-reviews__modal-actions">
                <button type="submit" className="admin-gen-reviews__submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 size={14} className="is-spin" /> Saving…
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button type="button" className="admin-gen-reviews__cancel" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
