import {
  MULTI_COLOR_GRADIENT,
  isMultiColor,
  resolveSwatchBackground,
  resolveSwatchColor,
  resolveMultiSplitColors,
  COLOR_SWATCH,
  UNKNOWN_SWATCH_HEX,
} from '@/features/product/colorSwatch'

export {
  MULTI_COLOR_GRADIENT,
  isMultiColor,
  resolveSwatchBackground,
  resolveSwatchColor,
  resolveMultiSplitColors,
  COLOR_SWATCH,
  UNKNOWN_SWATCH_HEX,
}

function asUnavailableSet(values) {
  if (!values) return new Set()
  if (values instanceof Set) return values
  return new Set(Array.isArray(values) ? values : [])
}

export function SizeSelector({
  sizes,
  selected,
  onSelect,
  label = 'Size',
  showFitHint = true,
  outOfStockValues,
}) {
  if (!sizes?.length) return null
  const unavailable = asUnavailableSet(outOfStockValues)
  const selectedUnavailable = selected != null && unavailable.has(selected)

  return (
    <div className="pdp-option">
      <div className="pdp-option__head">
        <p className="heading-sm">
          {label}: <span className="pdp-option__value">{selected}</span>
          {selectedUnavailable ? (
            <span className="pdp-option__oos-label"> · Not available</span>
          ) : null}
        </p>
        {showFitHint ? (
          <p className="pdp-option__hint">True to size. See size guide for measurements.</p>
        ) : null}
      </div>
      <div className="size-selector">
        {sizes.map((size) => {
          const isOos = unavailable.has(size)
          return (
            <button
              key={size}
              type="button"
              className={[
                'size-selector__btn',
                selected === size ? 'size-selector__btn--active' : '',
                isOos ? 'size-selector__btn--oos' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect(size)}
              aria-pressed={selected === size}
              aria-label={isOos ? `${size}, not available` : size}
              title={isOos ? `${size} — Not available` : size}
            >
              {size}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ColorSelector({
  colors,
  selected,
  onSelect,
  label = 'Color',
  outOfStockValues,
  swatchHexByValue,
}) {
  if (!colors?.length) return null
  const unavailable = asUnavailableSet(outOfStockValues)
  const selectedUnavailable = selected != null && unavailable.has(selected)
  const hexMap =
    swatchHexByValue && typeof swatchHexByValue === 'object' ? swatchHexByValue : {}

  return (
    <div className="pdp-option">
      <div className="pdp-option__head">
        <p className="heading-sm">
          {label}: <span className="pdp-option__value">{selected}</span>
          {selectedUnavailable ? (
            <span className="pdp-option__oos-label"> · Not available</span>
          ) : null}
        </p>
      </div>
      <div className="color-selector">
        {colors.map((color) => {
          const isOos = unavailable.has(color)
          const isMulti = isMultiColor(color)
          const hexHint =
            hexMap[color] ||
            hexMap[String(color || '').toLowerCase()] ||
            undefined
          return (
            <button
              key={color}
              type="button"
              className={[
                'color-selector__swatch',
                selected === color ? 'color-selector__swatch--active' : '',
                isOos ? 'color-selector__swatch--oos' : '',
                isMulti ? 'color-selector__swatch--multi' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ background: resolveSwatchBackground(color, hexHint) }}
              onClick={() => onSelect(color)}
              aria-pressed={selected === color}
              aria-label={isOos ? `${color}, not available` : color}
              title={isOos ? `${color} — Not available` : color}
            />
          )
        })}
      </div>
    </div>
  )
}

/** Generic attribute picker (Material, Style, etc.) — same button UI as size. */
export function AttributeSelector({
  values,
  selected,
  onSelect,
  label,
  outOfStockValues,
}) {
  return (
    <SizeSelector
      sizes={values}
      selected={selected}
      onSelect={onSelect}
      label={label}
      showFitHint={false}
      outOfStockValues={outOfStockValues}
    />
  )
}
