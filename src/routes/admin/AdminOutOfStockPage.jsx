import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  extractListPayload,
} from '@/features/admin/components/AdminUi'
import { useAdminOosInquiries } from '@/features/admin/hooks'
import { Button } from '@/components/ui/Button'

const LIMIT = 20

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export default function AdminOutOfStockPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [days, setDays] = useState(30)

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminOosInquiries({
    page,
    limit: LIMIT,
    search,
    days,
  })

  const { items: inquiries, pagination } = useMemo(() => {
    if (Array.isArray(data?.data)) {
      return { items: data.data, pagination: data.pagination || {} }
    }
    return extractListPayload(data, ['data', 'inquiries'])
  }, [data])

  const total = Number(pagination?.total ?? inquiries.length) || 0
  const totalPages = Math.max(1, Number(pagination?.totalPages) || 1)

  const pageButtons = useMemo(() => {
    const maxButtons = 5
    const start = Math.max(1, Math.min(page - 2, totalPages - maxButtons + 1))
    const end = Math.min(totalPages, start + maxButtons - 1)
    const list = []
    for (let i = Math.max(1, start); i <= end; i += 1) list.push(i)
    return list
  }, [page, totalPages])

  const applyFilters = (e) => {
    e?.preventDefault?.()
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Out Of Stock Query"
        title="Out of Stock Query"
      >
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </Button>
      </AdminPageHeader>
      <p className="admin-oos__subtitle">
        Customers who asked to be notified when a product is back in stock.
      </p>

      <form className="admin-oos__filters" onSubmit={applyFilters}>
        <div className="admin-oos__search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search email, phone, product name…"
            aria-label="Search inquiries"
          />
        </div>
        <select
          className="admin-oos__days"
          value={days}
          onChange={(e) => {
            setDays(Number(e.target.value) || 30)
            setPage(1)
          }}
          aria-label="Date range"
        >
          <option value={15}>Last 15 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>
        <Button type="submit" variant="primary" size="sm" className="admin-oos__apply">
          Apply
        </Button>
      </form>

      <div className="admin-card admin-card--flush admin-oos__card">
        {isFetching && !isLoading ? (
          <div className="admin-oos__updating" aria-busy="true" aria-live="polite">
            <span className="admin-oos__spinner" />
            Updating results…
          </div>
        ) : null}

        {isLoading && <AdminLoading label="Loading inquiries…" />}
        {isError && <AdminError message={error?.message || 'Could not load inquiries.'} onRetry={refetch} />}
        {!isLoading && !isError && inquiries.length === 0 && (
          <AdminEmpty message="No out-of-stock inquiries in this range." />
        )}
        {!isLoading && !isError && inquiries.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Customer</th>
                  <th className="admin-oos__col-date">Date</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((item) => (
                  <tr key={item.id || item._id}>
                    <td>
                      <div className="admin-oos__product">
                        {item.productImage ? (
                          <img src={item.productImage} alt="" />
                        ) : (
                          <div className="admin-oos__product-ph" aria-hidden="true" />
                        )}
                        <div className="admin-oos__product-meta">
                          <span className="admin-oos__product-name">
                            {item.productName || item.productSlug || 'Product'}
                          </span>
                          {item.variantSku ? (
                            <span className="admin-oos__product-sku">SKU: {item.variantSku}</span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-oos__customer">
                        {item.email || item.userEmail ? (
                          <span>{item.email || item.userEmail}</span>
                        ) : null}
                        {item.phone ? <span>{item.phone}</span> : null}
                        {!item.email && !item.userEmail && !item.phone ? <span>—</span> : null}
                      </div>
                    </td>
                    <td className="admin-oos__col-date">{fmtDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="admin-oos__pager">
          <button
            type="button"
            className="admin-oos__pager-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          {pageButtons.map((p) => (
            <button
              key={p}
              type="button"
              className={`admin-oos__pager-num${page === p ? ' is-active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className="admin-oos__pager-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
          <span className="admin-oos__pager-total">{total} total</span>
        </div>
      </div>
    </div>
  )
}
