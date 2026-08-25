/**
 * Optional per-variant title, description, and shipping (falls back to product-level when empty).
 */
export default function VariantCatalogFieldsSection({
  title = '',
  description = '',
  shipping = { weight: '', dimensions: { length: '', width: '', height: '' } },
  onTitleChange,
  onDescriptionChange,
  onShippingChange,
  compact = false,
}) {
  const dims = shipping?.dimensions || {}

  const setDim = (key, value) => {
    onShippingChange({
      ...shipping,
      dimensions: { ...dims, [key]: value },
    })
  }

  return (
    <div className={`pf-variant-section${compact ? '' : ' pf-variant-section--divided'}`}>
      <div>
        <p className="pf-variant-label">Variant display & shipping</p>
        <p className="pf-variant-hint">
          Optional — leave blank to use product-level title, description, and shipping.
        </p>
      </div>

      <div className="pf-variant-field">
        <label>Variant title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="pf-variant-input"
          placeholder="Customer-facing title for this SKU"
        />
      </div>

      <div className="pf-variant-field">
        <label>Variant description</label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={compact ? 2 : 3}
          className="pf-variant-input pf-variant-textarea"
          placeholder="Specifications / details for this variant"
        />
      </div>

      <div className="pf-variant-field">
        <label>Weight (kg) & dimensions (cm)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={shipping?.weight ?? ''}
          onChange={(e) => onShippingChange({ ...shipping, weight: e.target.value })}
          className="pf-variant-input pf-variant-input--half"
          placeholder="Weight (kg)"
        />
        <div className="pf-variant-grid pf-variant-grid--3">
          {['length', 'width', 'height'].map((dim) => (
            <input
              key={dim}
              type="number"
              step="0.1"
              min="0"
              value={dims[dim] ?? ''}
              onChange={(e) => setDim(dim, e.target.value)}
              className="pf-variant-input"
              placeholder={dim.charAt(0).toUpperCase() + dim.slice(1)}
            />
          ))}
        </div>
        <p className="pf-variant-footnote">
          Used for checkout delivery charge and Shiprocket. All four values required to save variant-level shipping.
        </p>
      </div>
    </div>
  )
}
