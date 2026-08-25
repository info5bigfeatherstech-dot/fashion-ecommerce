import { useState } from 'react'

export default function AttributeModal({ onAdd, onClose, initialValue = null }) {
  const isEditMode = !!initialValue
  const [newAttribute, setNewAttribute] = useState({
    key: initialValue?.key || '',
    value: initialValue?.value || '',
  })

  const canSubmit = Boolean(newAttribute.key.trim() && newAttribute.value.trim())

  const handleAdd = () => {
    if (!canSubmit) return
    onAdd(
      isEditMode
        ? { ...newAttribute, key: newAttribute.key.trim(), value: newAttribute.value.trim(), id: initialValue.id }
        : { key: newAttribute.key.trim(), value: newAttribute.value.trim(), id: Date.now() }
    )
    setNewAttribute({ key: '', value: '' })
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="pf-attr-overlay" onClick={onClose} role="presentation">
      <div
        className="pf-attr-card"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label={isEditMode ? 'Edit Attribute' : 'Add Attribute'}
      >
        <h3 className="pf-attr-card__title">{isEditMode ? 'Edit Attribute' : 'Add Attribute'}</h3>

        <div className="pf-attr-card__fields">
          <input
            type="text"
            value={newAttribute.key}
            onChange={(e) => setNewAttribute({ ...newAttribute, key: e.target.value })}
            className="pf-attr-input pf-attr-input--key"
            placeholder="Key (e.g., Material)"
            autoFocus
          />
          <input
            type="text"
            value={newAttribute.value}
            onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
            className="pf-attr-input pf-attr-input--value"
            placeholder="Value (e.g., Cotton)"
          />
        </div>

        <div className="pf-attr-card__actions">
          <button type="button" className="pf-attr-btn pf-attr-btn--cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="pf-attr-btn pf-attr-btn--add"
            onClick={handleAdd}
            disabled={!canSubmit}
          >
            {isEditMode ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
