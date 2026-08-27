import { JEWELRY_CATEGORIES } from '@/config/site'

export const PRICE_RANGES = [
  { key: 'all', label: 'All prices' },
  { key: '0-200', label: 'Under ₹200', min: 0, max: 199 },
  { key: '200-500', label: '₹200 – ₹500', min: 200, max: 500 },
  { key: '500-1000', label: '₹500 – ₹1,000', min: 500, max: 1000 },
  { key: '1000-plus', label: '₹1,000 & above', min: 1000 },
]

export const BADGE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'sale', label: 'Sale' },
  { value: 'bestseller', label: 'Bestseller' },
  { value: 'limited', label: 'Limited' },
]

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const COLOR_OPTIONS = ['Black', 'Ivory', 'Navy', 'Nude', 'White', 'Camel', 'Charcoal']

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
