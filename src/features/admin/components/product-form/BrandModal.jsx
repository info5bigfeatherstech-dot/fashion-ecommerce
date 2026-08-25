import { useState } from 'react'
import { Tag, X } from 'lucide-react'

export function BrandModal({ brands, setBrands, onSelect, onClose }) {
  const [newBrand, setNewBrand] = useState('')
  const [error, setError] = useState('')

  const trimmed = newBrand.trim()
  const canSubmit = Boolean(trimmed)

  const handleAdd = () => {
    if (!trimmed) {
      setError('Brand name cannot be empty')
      return
    }
    if (brands.includes(trimmed)) {
      setError('This brand already exists')
      return
    }
    const updated = [...brands, trimmed].sort()
    setBrands(updated)
    onSelect(trimmed)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="pf-quick-overlay" onClick={onClose} role="presentation">
      <div
        className="pf-quick-card"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pf-quick-brand-title"
      >
        <div className="pf-quick-card__head">
          <div className="pf-quick-card__head-main">
            <span className="pf-quick-card__icon" aria-hidden>
              <Tag size={18} />
            </span>
            <div>
              <h3 id="pf-quick-brand-title" className="pf-quick-card__title">
                Add brand
              </h3>
              <p className="pf-quick-card__subtitle">Add a brand option for this product</p>
            </div>
          </div>
          <button type="button" className="pf-quick-card__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="pf-quick-card__body">
          {error ? (
            <div className="pf-quick-card__error" role="alert">
              {error}
            </div>
          ) : null}

          <label className="pf-quick-field" htmlFor="pf-quick-brand-name">
            <span className="pf-quick-field__label">Brand name</span>
            <input
              id="pf-quick-brand-name"
              type="text"
              value={newBrand}
              onChange={(e) => {
                setNewBrand(e.target.value)
                setError('')
              }}
              className="pf-quick-field__input"
              placeholder="e.g. Apple, Samsung, Nike"
              autoFocus
            />
          </label>
        </div>

        <div className="pf-quick-card__footer">
          <button type="button" className="pf-quick-btn pf-quick-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="pf-quick-btn pf-quick-btn--primary"
            onClick={handleAdd}
            disabled={!canSubmit}
          >
            Add brand
          </button>
        </div>
      </div>
    </div>
  )
}
