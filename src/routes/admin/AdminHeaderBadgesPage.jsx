import { Link, useNavigate } from 'react-router-dom'
import { AdminError, AdminLoading } from '@/features/admin/components/AdminUi'
import {
  getHeaderBadgeEditPath,
  HEADER_BADGES,
} from '@/features/admin/config/headerBadges'
import { useAdminHeaderBadgesList } from '@/features/admin/hooks/useAdminHeaderBadge'

/**
 * WordPress-style list table of storefront header badges.
 * Click a row (or Edit) to open the manage screen for that badge.
 */
export default function AdminHeaderBadgesPage() {
  const navigate = useNavigate()
  const { rows, isLoading, isError, refetchAll } = useAdminHeaderBadgesList()

  return (
    <div className="admin-page admin-hb-list">
      <div className="admin-hb-list__head">
        <div>
          <p className="admin-hb-list__eyebrow">Settings · Website</p>
          <h1 className="admin-hb-list__title">
            Header badges
            <span className="admin-hb-list__count">{HEADER_BADGES.length}</span>
          </h1>
          <p className="admin-hb-list__desc">
            Toggle visibility and rename badges shown in the storefront header. Click a badge to
            manage it.
          </p>
        </div>
      </div>

      {isLoading && <AdminLoading />}
      {isError && (
        <AdminError message="Could not load one or more badges" onRetry={refetchAll} />
      )}

      {!isLoading && (
        <div className="admin-hb-list__panel">
          <div className="admin-hb-list__toolbar">
            <span className="admin-hb-list__toolbar-text">
              {HEADER_BADGES.length} item{HEADER_BADGES.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table admin-hb-list__table">
              <thead>
                <tr>
                  <th scope="col">Badge</th>
                  <th scope="col">Status</th>
                  <th scope="col">Label</th>
                  <th scope="col">Shop URL</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const def = row.def
                  if (!def) return null
                  const enabled = Boolean(row.data?.enabled)
                  const label =
                    String(row.data?.label || def.defaultLabel).trim() || def.defaultLabel
                  const editPath = getHeaderBadgeEditPath(def.id)

                  return (
                    <tr
                      key={def.id}
                      className="admin-hb-list__row"
                      tabIndex={0}
                      onClick={() => navigate(editPath)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigate(editPath)
                        }
                      }}
                    >
                      <td>
                        <strong className="admin-hb-list__name">{def.name}</strong>
                        <div className="admin-hb-list__row-actions">
                          <Link
                            to={editPath}
                            className="admin-hb-list__edit"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Edit
                          </Link>
                          <span className="admin-hb-list__sep" aria-hidden>
                            |
                          </span>
                          <span className="admin-hb-list__muted">
                            Tag: {def.productTagLabel}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`admin-hb-list__status${
                            enabled
                              ? ' admin-hb-list__status--live'
                              : ' admin-hb-list__status--hidden'
                          }`}
                        >
                          {enabled ? 'Live' : 'Hidden'}
                        </span>
                      </td>
                      <td className="admin-hb-list__label-cell">
                        {row.isError ? (
                          <span className="admin-hb-list__muted">Failed to load</span>
                        ) : (
                          label
                        )}
                      </td>
                      <td>
                        <code className="admin-hb-list__code">{def.shopPath}</code>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
