export function SizeSelector({ sizes, selected, onSelect, label = 'Size' }) {
  if (!sizes?.length) return null

  return (
    <div>
      <p className="heading-sm" style={{ marginBottom: 'var(--space-2)' }}>
        {label}: {selected && <span style={{ textTransform: 'none', letterSpacing: 0 }}>{selected}</span>}
      </p>
      <div className="size-selector">
        {sizes.map((size) => (
          <button
            key={size}
            className={`size-selector__btn ${selected === size ? 'size-selector__btn--active' : ''}`}
            onClick={() => onSelect(size)}
            aria-pressed={selected === size}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ColorSelector({ colors, selected, onSelect, label = 'Color' }) {
  if (!colors?.length) return null

  return (
    <div>
      <p className="heading-sm" style={{ marginBottom: 'var(--space-2)' }}>
        {label}: {selected && <span style={{ textTransform: 'none', letterSpacing: 0 }}>{selected}</span>}
      </p>
      <div className="size-selector">
        {colors.map((color) => (
          <button
            key={color}
            className={`size-selector__btn ${selected === color ? 'size-selector__btn--active' : ''}`}
            onClick={() => onSelect(color)}
            aria-pressed={selected === color}
          >
            {color}
          </button>
        ))}
      </div>
    </div>
  )
}
