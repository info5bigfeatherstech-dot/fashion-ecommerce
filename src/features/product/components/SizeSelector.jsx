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

function resolveSwatchColor(name) {
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

export function SizeSelector({ sizes, selected, onSelect, label = 'Size', showFitHint = true }) {
  if (!sizes?.length) return null

  return (
    <div className="pdp-option">
      <div className="pdp-option__head">
        <p className="heading-sm">
          {label}: <span className="pdp-option__value">{selected}</span>
        </p>
        {showFitHint ? <span className="pdp-option__hint">True to size</span> : null}
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
            style={{ backgroundColor: resolveSwatchColor(color) }}
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

/** Generic attribute picker (Material, Style, etc.) — same button UI as size. */
export function AttributeSelector({ values, selected, onSelect, label }) {
  return (
    <SizeSelector
      sizes={values}
      selected={selected}
      onSelect={onSelect}
      label={label}
      showFitHint={false}
    />
  )
}
