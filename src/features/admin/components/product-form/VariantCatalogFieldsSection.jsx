/**
 * Optional per-variant display title and description.
 */
export default function VariantCatalogFieldsSection({
  title = '',
  description = '',
  onTitleChange,
  onDescriptionChange,
  compact = false,
}) {
  return (
    <div className={`pf-variant-section${compact ? '' : ' pf-variant-section--divided'}`}>
      <div>
        <p className="pf-variant-label">Variant display details (Optional)</p>
        <p className="pf-variant-hint">
          Optional customer-facing title and specifications for this variant.
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
    </div>
  )
}
