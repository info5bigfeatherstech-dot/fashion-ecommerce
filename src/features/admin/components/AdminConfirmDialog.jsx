import { AlertTriangle, Archive, Trash2, X } from 'lucide-react'

const TONE_ICONS = {
  warn: AlertTriangle,
  danger: Trash2,
  archive: Archive,
}

/**
 * Reusable admin confirmation popup (replaces window.confirm).
 */
export function AdminConfirmDialog({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'warn',
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  const Icon = TONE_ICONS[tone] || AlertTriangle

  return (
    <div
      className="pf-quick-overlay"
      onClick={() => {
        if (!busy) onCancel?.()
      }}
      role="presentation"
    >
      <div
        className={`pf-confirm-card pf-confirm-card--${tone}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        aria-describedby={description ? 'admin-confirm-desc' : undefined}
      >
        <div className="pf-confirm-card__head">
          <span className={`pf-confirm-card__icon pf-confirm-card__icon--${tone}`} aria-hidden>
            <Icon size={20} />
          </span>
          <button
            type="button"
            className="pf-quick-card__close"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="pf-confirm-card__body">
          <h3 id="admin-confirm-title" className="pf-confirm-card__title">
            {title}
          </h3>
          {description ? (
            <p id="admin-confirm-desc" className="pf-confirm-card__desc">
              {description}
            </p>
          ) : null}
        </div>

        <div className="pf-confirm-card__footer">
          <button
            type="button"
            className="pf-quick-btn pf-quick-btn--ghost"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`pf-quick-btn pf-confirm-btn pf-confirm-btn--${tone}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminConfirmDialog
