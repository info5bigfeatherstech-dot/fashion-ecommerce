/**
 * Optional per-variant display title and description.
 */
export default function VariantCatalogFieldsSection({
  title = '',
  description = '',
  placeholderTitle = '',
  placeholderDescription = '',
  onTitleChange,
  onDescriptionChange,
  compact = false,
}) {
  return (
    <div className={`pf-variant-section${compact ? '' : ' pf-variant-section--divided'}`}>
      <div>
        <p className="pf-variant-label">Variant display details (Optional)</p>
        <p className="pf-variant-hint">
          Optional — automatically uses the main product title and description if left blank.
        </p>
      </div>

      <div className="pf-variant-field">
        <label>Variant title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="pf-variant-input"
          placeholder={placeholderTitle || "Customer-facing title for this SKU"}
        />
      </div>

      <div className="pf-variant-field">
        <label>Variant description</label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={compact ? 2 : 3}
          className="pf-variant-input pf-variant-textarea"
          placeholder={placeholderDescription || "Specifications / details for this variant"}
        />
      </div>
    </div>
  )
}
