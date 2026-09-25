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
  Gray: '#8A8680',
  Silver: '#C0C0C0',
  Beige: '#D4C4A8',
  Khaki: '#C3B091',
  Maroon: '#6D1A2A',
  Red: '#C62828',
  Blue: '#1E4E8C',
  Green: '#2E7D4F',
  Yellow: '#E6B800',
  Pink: '#E8A0B0',
  Purple: '#6B3FA0',
  Orange: '#E07A3A',
  Cream: '#F2EDE3',
  'Light Wash': '#B7C4D4',
  'Dark Wash': '#2C3A4F',
  // Main Jewelry Colors & Multitone
  'Ruby Red': '#9B2335',
  'Emerald Green': '#137547',
  'Sapphire Blue': '#0F52BA',
  'Mint Green': '#8FE3C0',
  'Baby Pink': '#F7C6D0',
  'Clear White / Diamond': 'linear-gradient(135deg, #EBF4FF 0%, #FFFFFF 50%, #E2E8F0 100%)',
  Diamond: 'linear-gradient(135deg, #EBF4FF 0%, #FFFFFF 50%, #E2E8F0 100%)',
  'Clear White': '#FFFFFF',
  'Antique Silver': '#949599',
  'Oxidized Silver': '#4A4A4A',
  Rhodium: '#D1D5DB',
}

/** Vibrant 360-degree conic spectrum so every color is fully visible in the circular swatch. */
export const MULTI_COLOR_GRADIENT =
  'conic-gradient(from -45deg, #FF1E56 0deg, #FF7700 45deg, #FFD000 90deg, #00C853 145deg, #00B0FF 200deg, #651FFF 260deg, #F50057 315deg, #FF1E56 360deg)'

const MULTI_COLOR_REGEX =
  /^(multi([\s-]?(colou?red?|ply|ple|variant|colors?))?|rainbow|assorted|mixed|various|all[\s-]?colou?rs?)$/i

export function isMultiColor(name) {
  if (!name) return false
  const raw = String(name).trim()
  return MULTI_COLOR_REGEX.test(raw)
}

const CSS_NAMED = new Set([
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
  'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
  'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue',
  'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki',
  'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon',
  'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise',
  'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick',
  'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
  'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred', 'indigo',
  'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue',
  'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey',
  'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray',
  'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta',
  'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen',
  'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue',
  'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab',
  'orange', 'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise',
  'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple',
  'rebeccapurple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown',
  'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey',
  'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise',
  'violet', 'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen',
])

function hashToColor(name) {
  let hash = 0
  const text = String(name)
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }
  const hue = hash % 360
  const sat = 28 + (hash % 25)
  const light = 42 + (hash % 18)
  return `hsl(${hue} ${sat}% ${light}%)`
}

function resolveSingleColor(name) {
  if (!name) return '#888888'
  const raw = String(name).trim()
  if (!raw) return '#888888'
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return raw
  if (COLOR_SWATCH[raw]) return COLOR_SWATCH[raw]
  const match = Object.keys(COLOR_SWATCH).find(
    (key) => key.toLowerCase() === raw.toLowerCase()
  )
  if (match) return COLOR_SWATCH[match]
  if (CSS_NAMED.has(raw.toLowerCase())) return raw.toLowerCase()
  return hashToColor(raw)
}

export function resolveMultiSplitColors(raw) {
  if (!raw || typeof raw !== 'string') return null
  if (!/[/&+,]/.test(raw)) return null

  const parts = raw.split(/[/&+,]/).map((p) => p.trim()).filter(Boolean)
  if (parts.length < 2) return null

  if (parts.some((p) => isMultiColor(p))) {
    return MULTI_COLOR_GRADIENT
  }

  const resolved = parts.map((p) => resolveSingleColor(p))
  if (resolved.length >= 2) {
    return `linear-gradient(135deg, ${resolved.join(', ')})`
  }
  return null
}

/** Shared by PDP ColorSelector and listing ProductCard swatches. Supports colors & CSS gradients. */
export function resolveSwatchBackground(name) {
  if (!name) return '#888888'
  const raw = String(name).trim()
  if (!raw) return '#888888'

  if (isMultiColor(raw)) {
    return MULTI_COLOR_GRADIENT
  }

  const splitGradient = resolveMultiSplitColors(raw)
  if (splitGradient) {
    return splitGradient
  }

  return resolveSingleColor(raw)
}

/** Backwards-compatible alias for resolveSwatchBackground */
export const resolveSwatchColor = resolveSwatchBackground

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
        {showFitHint ? <span className="pdp-option__hint">True to size</span> : null}
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
              ].filter(Boolean).join(' ')}
              onClick={() => onSelect(size)}
              aria-pressed={selected === size}
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
}) {
  if (!colors?.length) return null
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
      </div>
      <div className="color-selector">
        {colors.map((color) => {
          const isOos = unavailable.has(color)
          const isMulti = isMultiColor(color)
          return (
            <button
              key={color}
              type="button"
              className={[
                'color-selector__swatch',
                selected === color ? 'color-selector__swatch--active' : '',
                isOos ? 'color-selector__swatch--oos' : '',
                isMulti ? 'color-selector__swatch--multi' : '',
              ].filter(Boolean).join(' ')}
              style={{ background: resolveSwatchBackground(color) }}
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
