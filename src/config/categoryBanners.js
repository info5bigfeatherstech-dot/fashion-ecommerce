import { JEWELRY_CATEGORIES } from '@/config/site'
import { formatCategoryTitle } from '@/lib/utils'
import giftBanner from '@/assets/gift.jpeg'

/**
 * Compact PLP banners for navbar jewelry categories.
 * Prefer admin category image when available; these are visual fallbacks.
 */
export const CATEGORY_BANNERS = {
  'earrings-studs': {
    title: 'Earrings & Studs',
    subtitle: 'Everyday studs to statement drops — shine for every look.',
    image:
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1800&h=700&q=80',
    alt: 'Earrings and studs jewelry collection',
  },
  rings: {
    title: 'Rings',
    subtitle: 'Stacks, solitaires, and festive bands made to last.',
    image:
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1800&h=700&q=80',
    alt: 'Rings jewelry collection',
  },
  'bracelets-bangles': {
    title: 'Bracelets & Bangles',
    subtitle: 'Layered bangles and bracelets for everyday elegance.',
    image:
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1800&h=700&q=80',
    alt: 'Bracelets and bangles jewelry collection',
  },
  'necklace-pendants': {
    title: 'Necklace & Pendants',
    subtitle: 'Delicate chains to bold pendants — finish every outfit.',
    image:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1800&h=700&q=80',
    alt: 'Necklace and pendants jewelry collection',
  },
  mangalsutras: {
    title: 'Mangalsutras',
    subtitle: 'Timeless mangalsutra designs for every celebration.',
    image:
      'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1800&h=700&q=80',
    alt: 'Mangalsutra jewelry collection',
  },
  sets: {
    title: 'Sets',
    subtitle: 'Matched jewelry sets ready to gift and wear.',
    image:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1800&h=700&q=80',
    alt: 'Jewelry sets collection',
  },
  gifting: {
    title: 'Gifting',
    subtitle: '',
    image: giftBanner,
    alt: 'Create a beautiful custom surprise for your loved ones in 3 simple steps',
    isGraphic: true,
    hideText: true,
  },
  sale: {
    title: 'Sale is Live',
    subtitle: 'Limited-time offers across your favorite jewelry picks.',
    image:
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1800&h=700&q=80',
    alt: 'Jewelry sale collection',
  },
}

const JEWELRY_SLUGS = new Set(JEWELRY_CATEGORIES.map((c) => c.slug))

export function getCategoryBanner(slug, { label, image } = {}) {
  if (!slug) return null
  const base = CATEGORY_BANNERS[slug]
  // Allow banners for any shop slug (API categories), not only the old static jewelry list.
  const known =
    Boolean(base) ||
    JEWELRY_SLUGS.has(slug) ||
    slug === 'sale' ||
    Boolean(label) ||
    Boolean(image)
  if (!known) return null

  const isGraphic = Boolean(base?.isGraphic || base?.hideText)
  const rawTitle =
    label ||
    base?.title ||
    JEWELRY_CATEGORIES.find((c) => c.slug === slug)?.label ||
    String(slug).replace(/-/g, ' ')

  const formattedTitle = formatCategoryTitle(rawTitle)

  return {
    title: isGraphic ? '' : formattedTitle,
    subtitle: isGraphic ? '' : (base?.subtitle || `Shop the latest ${formattedTitle} from FABUNIQO.`),
    image: image || base?.image || CATEGORY_BANNERS['earrings-studs'].image,
    alt: base?.alt || `${formattedTitle} collection`,
    isGraphic,
    hideText: isGraphic,
  }
}
