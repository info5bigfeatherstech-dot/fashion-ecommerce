import { JEWELRY_CATEGORIES } from '@/config/site'

export const PRICE_RANGES = [
  { key: 'all', label: 'All prices' },
  { key: 'under-99', label: 'Under ₹99', min: 0, max: 98.99 },
  { key: '99-199', label: '₹99 - ₹199', min: 99, max: 199 },
  { key: '199-299', label: '₹199 - ₹299', min: 199, max: 299 },
  { key: '299-599', label: '₹299 - ₹599', min: 299, max: 599 },
  { key: '599-999', label: '₹599 - ₹999', min: 599, max: 999 },
  { key: 'above-999', label: 'Above ₹999', min: 999.01 },
]

export const MAIN_COLOR_OPTIONS = [
  { value: '', label: 'All colors' },
  { value: 'Ruby Red', label: 'Ruby Red' },
  { value: 'Emerald Green', label: 'Emerald Green' },
  { value: 'Sapphire Blue', label: 'Sapphire Blue' },
  { value: 'Mint Green', label: 'Mint Green' },
  { value: 'Baby Pink', label: 'Baby Pink' },
  { value: 'Clear White / Diamond', label: 'Clear White / Diamond' },
  { value: 'Multi-Color', label: 'Multi-Color' },
]

export const PLATING_OPTIONS = [
  { value: '', label: 'All plating' },
  { value: 'Gold Plated', label: 'Gold Plated' },
  { value: 'Silver Plated', label: 'Silver Plated' },
  { value: 'Rose Gold Plated', label: 'Rose Gold Plated' },
  { value: 'Oxidized / Antique Silver', label: 'Oxidized / Antique Silver' },
  { value: 'Rhodium Plated', label: 'Rhodium Plated' },
]

export const DISCOUNT_OPTIONS = [
  { value: '', label: 'All discounts' },
  { value: '10', label: '10% Off & Above', minDiscount: 10 },
  { value: '20', label: '20% Off & Above', minDiscount: 20 },
  { value: '30', label: '30% Off & Above', minDiscount: 30 },
  { value: '50', label: '50% Off & Above', minDiscount: 50 },
  { value: 'mega-clearance', label: 'Mega Clearance Sale', tag: 'mega-clearance' },
]

/** @deprecated Fashion badges — kept for older URLs */
export const BADGE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'sale', label: 'Sale' },
  { value: 'bestseller', label: 'Bestseller' },
  { value: 'limited', label: 'Limited' },
]

/** @deprecated Clothing sizes — jewelry PLP no longer uses these */
export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

/** @deprecated Fashion colors — use MAIN_COLOR_OPTIONS */
export const COLOR_OPTIONS = MAIN_COLOR_OPTIONS.filter((o) => o.value).map((o) => o.value)

export const TOP_CATEGORIES = JEWELRY_CATEGORIES.map(({ label, slug }) => ({ label, slug }))

const IMAGE_PARAMS = 'auto=format&fit=crop&w=800&h=1000&q=80'

export const DUMMY_PRODUCT_IMAGES = [
  `https://images.unsplash.com/photo-1611652022419-a9419f74343d?${IMAGE_PARAMS}`,
  `https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?${IMAGE_PARAMS}`,
  `https://images.unsplash.com/photo-1617038220319-276d3cfab638?${IMAGE_PARAMS}`,
  `https://images.unsplash.com/photo-1602173574767-37ac01994b2a?${IMAGE_PARAMS}`,
  `https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?${IMAGE_PARAMS}`,
  `https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?${IMAGE_PARAMS}`,
  `https://images.unsplash.com/photo-1523275335684-37898b6baf30?${IMAGE_PARAMS}`,
  `https://images.unsplash.com/photo-1542291026-7eec264c27ff?${IMAGE_PARAMS}`,
  `https://images.unsplash.com/photo-1590874103328-eac38a683ce7?${IMAGE_PARAMS}`,
  `https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?${IMAGE_PARAMS}`,
]

export function getDummyProductImages(seed = '') {
  const hash = [...String(seed)].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const primary = DUMMY_PRODUCT_IMAGES[hash % DUMMY_PRODUCT_IMAGES.length]
  const secondary = DUMMY_PRODUCT_IMAGES[(hash + 3) % DUMMY_PRODUCT_IMAGES.length]
  return primary === secondary ? [primary] : [primary, secondary]
}
