import { useState } from 'react'
import { FolderPlus, X } from 'lucide-react'
import { createAdminCategory } from '@/features/admin/api/products'

export function CategoryQuickModal({ onSelect, onCreated, onClose }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const trimmed = name.trim()
  const canSubmit = Boolean(trimmed) && !saving

  const handleSave = async () => {
    if (!trimmed) {
      setError('Category name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const category = await createAdminCategory({ name: trimmed })
      const id = category?._id || category?.id
      if (id) onSelect(id)
      onCreated?.(category)
      onClose()
    } catch (err) {
      setError(err?.message || 'Could not create category')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (!saving) onClose()
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div
      className="pf-quick-overlay"
      onClick={() => {
        if (!saving) onClose()
      }}
      role="presentation"
    >
      <div
        className="pf-quick-card"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pf-quick-category-title"
      >
        <div className="pf-quick-card__head">
          <div className="pf-quick-card__head-main">
            <span className="pf-quick-card__icon" aria-hidden>
              <FolderPlus size={18} />
            </span>
            <div>
              <h3 id="pf-quick-category-title" className="pf-quick-card__title">
                Add category
              </h3>
              <p className="pf-quick-card__subtitle">Create a new catalog category for this product</p>
            </div>
          </div>
          <button
            type="button"
            className="pf-quick-card__close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="pf-quick-card__body">
          {error ? (
            <div className="pf-quick-card__error" role="alert">
              {error}
            </div>
          ) : null}

          <label className="pf-quick-field" htmlFor="pf-quick-category-name">
            <span className="pf-quick-field__label">Category name</span>
            <input
              id="pf-quick-category-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              className="pf-quick-field__input"
              placeholder="e.g. Electronics, Bangles, Necklaces"
              autoFocus
              disabled={saving}
            />
          </label>
        </div>

        <div className="pf-quick-card__footer">
          <button
            type="button"
            className="pf-quick-btn pf-quick-btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="pf-quick-btn pf-quick-btn--primary"
            onClick={handleSave}
            disabled={!canSubmit}
          >
            {saving ? 'Creating…' : 'Add category'}
          </button>
        </div>
      </div>
    </div>
  )
}
