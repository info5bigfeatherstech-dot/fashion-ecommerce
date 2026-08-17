const COLOR_SWATCH = {
  Ink: '#14120F',
  Ivory: '#F4EFE6',
  Charcoal: '#3A3A3A',
  Camel: '#C4A574',
  Navy: '#1B2A4A',
  Oat: '#D8C9B0',
  Forest: '#2D4A3E',
  Stone: '#C5BBA8',
  Olive: '#6B7C4A',
  Sage: '#9CAF88',
  Blush: '#E8B4B8',
  Rosewood: '#8A3D4B',
  Crimson: '#9B2335',
  Nude: '#E6C9B8',
  Berry: '#6B2D5B',
  Fair: '#F3E0D0',
  Light: '#E8C4A8',
  Medium: '#C48A62',
  Tan: '#C2A383',
  Deep: '#5C3317',
  Black: '#14120F',
  Brown: '#5C4033',
  Petal: '#F2C4C8',
  Apricot: '#E8A87C',
  Rose: '#D4A5A5',
  White: '#FAF7F2',
  Steel: '#7A8490',
  Gold: '#C9A227',
  'Rose Gold': '#B76E79',
  Burgundy: '#6D1A2A',
  Grey: '#8A8680',
  Cream: '#F2EDE3',
  'Light Wash': '#B7C4D4',
  'Dark Wash': '#2C3A4F',
}

export function SizeSelector({ sizes, selected, onSelect, label = 'Size' }) {
  if (!sizes?.length) return null

  return (
    <div className="pdp-option">
      <div className="pdp-option__head">
        <p className="heading-sm">
          {label}: <span className="pdp-option__value">{selected}</span>
        </p>
        <span className="pdp-option__hint">True to size</span>
      </div>
      <div className="size-selector">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
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
    <div className="pdp-option">
      <div className="pdp-option__head">
        <p className="heading-sm">
          {label}: <span className="pdp-option__value">{selected}</span>
        </p>
      </div>
      <div className="color-selector">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-selector__swatch ${selected === color ? 'color-selector__swatch--active' : ''}`}
            style={{ backgroundColor: COLOR_SWATCH[color] || '#888888' }}
            onClick={() => onSelect(color)}
            aria-pressed={selected === color}
            aria-label={color}
            title={color}
          />
        ))}
      </div>
    </div>
  )
}
