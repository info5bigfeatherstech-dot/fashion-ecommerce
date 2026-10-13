/**
 * Storefront + admin color swatch resolution.
 * Prefer persisted variant attribute `hex`, then known name map, then CSS names.
 * Unknown names use a neutral gray — never a random hash hue (looks like a real color).
 */

export const UNKNOWN_SWATCH_HEX = '#A8A29E'

/** Vibrant 360° spectrum for multi/rainbow labels. */
export const MULTI_COLOR_GRADIENT =
  'conic-gradient(from -45deg, #FF1E56 0deg, #FF7700 45deg, #FFD000 90deg, #00C853 145deg, #00B0FF 200deg, #651FFF 260deg, #F50057 315deg, #FF1E56 360deg)'

export const COLOR_KEY_RE = /colou?r|shade|main\s*colou?r/i

export const PLATING_OPTIONS = [
  'Gold Plated',
  'Silver Plated',
  'Rose Gold Plated',
  'Oxidized Silver',
  'Antique Gold',
  'Antique Silver',
  'Rhodium Plated',
  'Black Metal / Gunmetal',
  'Two-Tone',
  'Multi-Tone',
]

export const PLATING_KEY_RE = /^plat(?:ing|ed)?$/i

export function isPlatingAttributeKey(key) {
  if (!key) return false
  return PLATING_KEY_RE.test(String(key).trim())
}

export const COLOR_SWATCH = {
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
  'Ruby Red': '#9B2335',
  'Emerald Green': '#137547',
  'Sapphire Blue': '#0F52BA',
  'Mint Green': '#8FE3C0',
  'Baby Pink': '#F7C6D0',
  'Clear White / Diamond':
    'linear-gradient(135deg, #EBF4FF 0%, #FFFFFF 50%, #E2E8F0 100%)',
  'White / Diamond':
    'linear-gradient(135deg, #EBF4FF 0%, #FFFFFF 50%, #E2E8F0 100%)',
  Diamond: 'linear-gradient(135deg, #EBF4FF 0%, #FFFFFF 50%, #E2E8F0 100%)',
  Peach: '#FFCBA4',
  'Clear White': '#FFFFFF',
  'Antique Silver': '#949599',
  'Antique Gold': '#C9A227',
  'Gold Plated': '#C9A227',
  'Silver Plated': '#C0C0C0',
  'Rose Gold Plated': '#B76E79',
  'Oxidized Silver': '#4A4A4A',
  Rhodium: '#D1D5DB',
  'Rhodium Plated': '#D1D5DB',
  'Black Metal / Gunmetal': '#2B2B2B',
  Gunmetal: '#2B2B2B',
  'Two-Tone':
    'linear-gradient(135deg, #C9A227 0%, #C9A227 50%, #C0C0C0 50%, #C0C0C0 100%)',
  'Multi-Tone': MULTI_COLOR_GRADIENT,
  // Common fashion / jewelry names (incl. Ochre — was hashing to purple)
  Ochre: '#CC7722',
  Ocher: '#CC7722',
  Mustard: '#E1AD01',
  Cognac: '#9A463D',
  Terracotta: '#E2725B',
  Coral: '#FF7F50',
  Teal: '#008080',
  Turquoise: '#40E0D0',
  Lavender: '#B57EDC',
  Lilac: '#C8A2C8',
  Magenta: '#C2185B',
  Wine: '#722F37',
  Champagne: '#F7E7CE',
  Bronze: '#CD7F32',
  Copper: '#B87333',
  Pearl: '#F0EAD6',
  IvoryWhite: '#FFFFF0',
}

/** Typos / alternate spellings → canonical COLOR_SWATCH key */
const COLOR_ALIASES = {
  orchie: 'Ochre',
  ochrie: 'Ochre',
  ocher: 'Ocher',
  ochre: 'Ochre',
  'rose-gold': 'Rose Gold',
  rosegold: 'Rose Gold',
  gunmetal: 'Gunmetal',
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

const MULTI_COLOR_REGEX =
  /^(multi([\s-]?(colou?red?|ply|ple|variant|colors?))?|rainbow|assorted|mixed|various|all[\s-]?colou?rs?)$/i

export function isColorAttributeKey(key) {
  return COLOR_KEY_RE.test(String(key || '').trim())
}

export function isMultiColor(name) {
  if (!name) return false
  return MULTI_COLOR_REGEX.test(String(name).trim())
}

/** @returns {string|undefined} normalized #RRGGBB */
export function normalizeHexColor(raw) {
  const s = String(raw || '').trim()
  if (!s) return undefined
  const withHash = s.startsWith('#') ? s : `#${s}`
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(withHash)) return undefined
  if (withHash.length === 4) {
    const r = withHash[1]
    const g = withHash[2]
    const b = withHash[3]
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return withHash.toUpperCase()
}

function lookupSwatchMap(name) {
  const raw = String(name || '').trim()
  if (!raw) return null
  if (COLOR_SWATCH[raw]) return COLOR_SWATCH[raw]
  const aliasKey = COLOR_ALIASES[raw.toLowerCase().replace(/\s+/g, ' ').trim()]
  if (aliasKey && COLOR_SWATCH[aliasKey]) return COLOR_SWATCH[aliasKey]
  const match = Object.keys(COLOR_SWATCH).find(
    (key) => key.toLowerCase() === raw.toLowerCase()
  )
  return match ? COLOR_SWATCH[match] : null
}

/** Suggest a solid hex for admin when typing a color name (gradients skipped). */
export function suggestHexForColorName(name) {
  const mapped = lookupSwatchMap(name)
  if (!mapped) {
    const css = String(name || '').trim().toLowerCase()
    if (CSS_NAMED.has(css)) {
      // Let the browser resolve named CSS via a temporary element? Keep simple: only map/hex.
      return undefined
    }
    return undefined
  }
  if (String(mapped).startsWith('#')) return normalizeHexColor(mapped)
  return undefined
}

function resolveSingleColor(name) {
  if (!name) return UNKNOWN_SWATCH_HEX
  const raw = String(name).trim()
  if (!raw) return UNKNOWN_SWATCH_HEX
  const asHex = normalizeHexColor(raw)
  if (asHex) return asHex
  const mapped = lookupSwatchMap(raw)
  if (mapped) return mapped
  if (CSS_NAMED.has(raw.toLowerCase())) return raw.toLowerCase()
  return UNKNOWN_SWATCH_HEX
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

/**
 * @param {string} name color label
 * @param {string} [hexHint] optional persisted attribute hex (preferred)
 */
export function resolveSwatchBackground(name, hexHint) {
  const hint = normalizeHexColor(hexHint)
  if (hint) return hint

  if (!name) return UNKNOWN_SWATCH_HEX
  const raw = String(name).trim()
  if (!raw) return UNKNOWN_SWATCH_HEX

  if (isMultiColor(raw)) return MULTI_COLOR_GRADIENT

  const splitGradient = resolveMultiSplitColors(raw)
  if (splitGradient) return splitGradient

  return resolveSingleColor(raw)
}

/** Backwards-compatible alias */
export const resolveSwatchColor = resolveSwatchBackground
