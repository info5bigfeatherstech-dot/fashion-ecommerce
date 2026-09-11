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
  },
  rings: {
    title: 'Rings',
    subtitle: 'Stacks, solitaires, and festive bands made to last.',
  },
  'bracelets-bangles': {
    title: 'Bracelets & Bangles',
    subtitle: 'Layered bangles and bracelets for everyday elegance.',
  },
  'necklace-pendants': {
    title: 'Necklace & Pendants',
    subtitle: 'Delicate chains to bold pendants — finish every outfit.',
  },
  mangalsutras: {
    title: 'Mangalsutras',
    subtitle: 'Timeless mangalsutra designs for every celebration.',
  },
  sets: {
    title: 'Sets',
    subtitle: 'Matched jewelry sets ready to gift and wear.',
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
  },
  'jewellery-spotted': {
    title: 'Jewellery Spotted',
    subtitle: 'Real people, real style. Tag #FABUNIQO on Instagram to be featured.',
  },
}

export const JEWELRY_FALLBACK_BANNER = ''

export function getCategoryBanner(slug, { label, image } = {}) {
  if (!slug) return null

  const base = CATEGORY_BANNERS[slug]
  const resolvedImage = image || (base?.isGraphic ? base.image : null)

  // Do not render banner without a real banner image
  if (!resolvedImage) return null

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
    image: resolvedImage,
    alt: base?.alt || `${formattedTitle} collection`,
    isGraphic,
    hideText: isGraphic,
  }
}
