import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { AdminError, AdminLoading } from '@/features/admin/components/AdminUi'
import {
  getHeaderBadgeDef,
  HEADER_BADGES_LIST_PATH,
} from '@/features/admin/config/headerBadges'
import { useAdminHeaderBadge } from '@/features/admin/hooks/useAdminHeaderBadge'

const MAX_LABEL = 48

/**
 * Edit screen for one header badge — opened from the list.
 * Update opens a confirmation popup; save runs only after OK.
 */
export default function AdminHeaderBadgeEditPage() {
  const { badgeId } = useParams()
  const def = getHeaderBadgeDef(badgeId)

  if (!def) {
    return <Navigate to={HEADER_BADGES_LIST_PATH} replace />
  }

  return <HeaderBadgeEditForm def={def} />
}

function HeaderBadgeEditForm({ def }) {
  const { data, isLoading, isError, error, refetch, update } = useAdminHeaderBadge(def.id)

  const [enabled, setEnabled] = useState(Boolean(def.defaultEnabled))
  const [label, setLabel] = useState(def.defaultLabel)
  const [dirty, setDirty] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!data) return
    setEnabled(Boolean(data.enabled))
    setLabel(String(data.label || def.defaultLabel).trim() || def.defaultLabel)
    setDirty(false)
  }, [data, def.defaultLabel])

  const nextLabelPreview = () =>
    String(label || '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, MAX_LABEL)

  const openConfirm = () => {
    const nextLabel = nextLabelPreview()
    if (!nextLabel) {
      toast.error('Badge label is required')
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmSave = async () => {
    const nextLabel = nextLabelPreview()
    if (!nextLabel) {
      setConfirmOpen(false)
      toast.error('Badge label is required')
      return
    }

    try {
      await update.mutateAsync({ enabled: Boolean(enabled), label: nextLabel })
      setLabel(nextLabel)
      setDirty(false)
      setConfirmOpen(false)
      toast.success(
        enabled ? `“${nextLabel}” is live on the storefront` : `“${nextLabel}” is hidden`
      )
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not save badge settings')
    }
  }

  const charCount = String(label || '').trim().length
  const saving = update.isPending
  const previewLabel = nextLabelPreview() || def.defaultLabel

  return (
    <div className="admin-page admin-hb-edit">
      <div className="admin-hb-edit__top">
        <Link to={HEADER_BADGES_LIST_PATH} className="admin-hb-edit__back">
          ← Header badges
        </Link>
        <h1 className="admin-hb-edit__title">Edit “{def.name}”</h1>
      </div>

      {isLoading && <AdminLoading />}
      {isError && <AdminError message={error?.message} onRetry={refetch} />}

      {!isLoading && !isError && (
        <div className="admin-hb-edit__layout">
          <div className="admin-hb-edit__main">
            <div className="admin-hb-edit__box">
              <div className="admin-hb-edit__box-head">Badge label</div>
              <div className="admin-hb-edit__box-body">
                <input
                  className="admin-hb-edit__title-input"
                  value={label}
                  maxLength={MAX_LABEL}
                  onChange={(e) => {
                    setLabel(e.target.value)
                    setDirty(true)
                  }}
                  placeholder={def.placeholder}
                  disabled={saving}
                  aria-label="Badge label"
                />
                <p className="admin-hb-edit__hint">
                  {charCount}/{MAX_LABEL} characters · shown in the storefront header
                </p>
              </div>
            </div>

            <div className="admin-hb-edit__box">
              <div className="admin-hb-edit__box-head">About this badge</div>
              <div className="admin-hb-edit__box-body admin-hb-edit__about">
                <p>{def.description}</p>
                <dl className="admin-hb-edit__meta">
                  <div>
                    <dt>Shop URL</dt>
                    <dd>
                      <code>{def.shopPath}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Product tag</dt>
                    <dd>
                      {def.productTagLabel}{' '}
                      <span className="admin-hb-edit__muted">({def.productTagSlug})</span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <aside className="admin-hb-edit__side">
            <div className="admin-hb-edit__box admin-hb-edit__publish">
              <div className="admin-hb-edit__box-head">Publish</div>
              <div className="admin-hb-edit__box-body">
                <div className="admin-hb-edit__status-row">
                  <span className="admin-hb-edit__status-label">Visibility</span>
                  <span
                    className={`admin-hb-list__status${
                      enabled
                        ? ' admin-hb-list__status--live'
                        : ' admin-hb-list__status--hidden'
                    }`}
                  >
                    {enabled ? 'Live' : 'Hidden'}
                  </span>
                </div>

                <label className="admin-hb-edit__switch-row">
                  <span>Show on storefront</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    className={`admin-hb-edit__toggle${enabled ? ' is-on' : ''}`}
                    disabled={saving}
                    onClick={() => {
                      setEnabled(!enabled)
                      setDirty(true)
                    }}
                  >
                    <span className="admin-hb-edit__toggle-thumb" />
                  </button>
                </label>
              </div>
              <div className="admin-hb-edit__publish-actions">
                {dirty && (
                  <button
                    type="button"
                    className="admin-hb-edit__discard"
                    disabled={saving}
                    onClick={() => {
                      setEnabled(Boolean(data?.enabled ?? def.defaultEnabled))
                      setLabel(
                        String(data?.label || def.defaultLabel).trim() || def.defaultLabel
                      )
                      setDirty(false)
                    }}
                  >
                    Discard
                  </button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={openConfirm}
                  disabled={saving || !dirty}
                >
                  Update
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <AdminConfirmDialog
        open={confirmOpen}
        title="Save badge changes?"
        description={
          enabled
            ? `Update “${def.name}” and show “${previewLabel}” on the storefront header?`
            : `Update “${def.name}” and hide this badge on the storefront?`
        }
        confirmLabel="OK, save"
        cancelLabel="Cancel"
        tone="warn"
        busy={saving}
        onConfirm={handleConfirmSave}
        onCancel={() => {
          if (!saving) setConfirmOpen(false)
        }}
      />
    </div>
  )
}
