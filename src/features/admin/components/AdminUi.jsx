import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function AdminPageHeader({ eyebrow, title, children }) {
  return (
    <header className="admin-page__head">
      <div>
        {eyebrow && <p className="heading-sm text-accent">{eyebrow}</p>}
        <h1 className="display-md">{title}</h1>
      </div>
      {children}
    </header>
  )
}

export function AdminLoading({ label = 'Loading…' }) {
  return (
    <div className="admin-empty">
      <Loader2 className="payment-overlay__spinner" size={22} />
      <p>{label}</p>
    </div>
  )
}

export function AdminError({ message, onRetry }) {
  return (
    <div className="admin-empty">
      <p>{message || 'Something went wrong'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>Retry</Button>
      )}
    </div>
  )
}

export function AdminEmpty({ message = 'No data yet.' }) {
  return (
    <div className="admin-empty">
      <p>{message}</p>
    </div>
  )
}

export function AdminPagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null
  return (
    <div className="admin-pagination">
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        Previous
      </button>
      <span className="body-sm text-muted">Page {page} of {totalPages}</span>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  )
}

export function AdminStatRow({ stats = [] }) {
  if (!stats.length) return null
  return (
    <div className="admin-stat-row">
      {stats.map((stat) => (
        <div key={stat.label} className="admin-stat">
          <span>{stat.label}</span>
          <strong>{stat.value ?? '—'}</strong>
        </div>
      ))}
    </div>
  )
}

export function AdminTable({ columns = [], rows = [], getRowKey }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getRowKey ? getRowKey(row, index) : index}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Normalize list responses from fabFE-style APIs. */
export function extractListPayload(data, listKeys = ['data', 'orders', 'products', 'users', 'staff', 'coupons', 'requests']) {
  if (Array.isArray(data)) return { items: data, pagination: {} }
  const inner = data?.data && typeof data.data === 'object' ? data.data : data
  for (const key of listKeys) {
    if (Array.isArray(inner?.[key])) {
      return {
        items: inner[key],
        pagination: inner.pagination || data?.pagination || {},
      }
    }
  }
  if (Array.isArray(inner)) return { items: inner, pagination: data?.pagination || {} }
  if (Array.isArray(data?.coupons)) return { items: data.coupons, pagination: data.pagination || {} }
  return { items: [], pagination: data?.pagination || inner?.pagination || {} }
}
