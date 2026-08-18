export const SITE_NAME = 'VERAÒ'
export const SITE_TAGLINE = 'Crafted for the world. Owned by us.'

export const PRODUCT_OFFER = {
  code: 'VERA26',
  label: 'Use code',
  detail: 'Extra 10% off at checkout',
}

export const TOP_BANNER = {
  badge: 'Circle Week',
  lead: 'Use code',
  code: 'VERA26',
  message: 'Free shipping over $100 · Double points for Circle members',
  terms: 'See terms in FAQ',
  href: '/loyalty',
}

export const NAV_ITEMS = [
  { label: 'Women', slug: 'women', megaMenu: true },
  { label: 'Men', slug: 'men', megaMenu: false },
  { label: 'Kids', slug: 'kids', megaMenu: false },
]

export const CATEGORY_STRIP = [
  { label: 'Women', slug: 'women', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&h=400&q=80' },
  { label: 'Men', slug: 'men', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=400&h=400&q=80' },
  { label: 'Kids', slug: 'kids', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=400&h=400&q=80' },
]

export const HERO_SLIDES = [
  {
    id: 'autumn',
    eyebrow: 'Autumn / Winter 2026',
    title: 'The World Wears One House',
    subtitle: 'From Paris ateliers to Seoul streets — every piece designed, made, and owned by VERAÒ.',
    cta: 'Explore New Drops',
    href: '/shop/new-arrivals',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&h=800&q=80',
    alt: 'VERAÒ Autumn Collection — model in layered silk and wool',
  },
  {
    id: 'beauty',
    eyebrow: 'Beauty Ritual',
    title: 'Skin, Color, Craft',
    subtitle: 'Lab-made formulas and pigment that belong to this house — skincare and makeup, no third party.',
    cta: 'Shop Beauty',
    href: '/shop/skincare',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&h=800&q=80',
    alt: 'VERAÒ skincare ritual — close portrait with luminous skin',
  },
  {
    id: 'atelier',
    eyebrow: 'Limited Edition',
    title: 'The Atelier Collection',
    subtitle: 'Hand-finished pieces in limited quantities. Once they are gone, they are gone.',
    cta: 'Shop the Collection',
    href: '/shop/women',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&h=800&q=80',
    alt: 'VERAÒ Atelier Collection — curated garments in a boutique interior',
  },
]

export const DEEP_CATEGORIES = [
  {
    label: 'Iconic Sneakers',
    slug: 'new-arrivals',
    offer: 'Min 30% off',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=520&h=720&q=80',
    imageBack: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=480&h=680&q=80',
  },
  {
    label: 'Silk Dresses',
    slug: 'women',
    offer: 'Up to 65% off',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=520&h=720&q=80',
    imageBack: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=480&h=680&q=80',
  },
  {
    label: 'Relaxed Shirts',
    slug: 'men',
    offer: 'Up to 70% off',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=520&h=720&q=80',
    imageBack: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=480&h=680&q=80',
  },
  {
    label: 'Soft Innerwear',
    slug: 'innerwear',
    offer: 'Up to 50% off',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=520&h=720&q=80',
    imageBack: 'https://images.unsplash.com/photo-1483985988355-763728ad1434?auto=format&fit=crop&w=480&h=680&q=80',
  },
  {
    label: 'Little Icons',
    slug: 'kids',
    offer: 'Min 40% off',
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=520&h=720&q=80',
    imageBack: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=480&h=680&q=80',
  },
]

export const EDITORIAL_GUIDES = [
  {
    tag: 'Style Edit',
    title: 'Autumn Layers: The Art of Texture',
    description: 'How to build a capsule wardrobe that transitions from city mornings to evening dinners.',
    slug: 'autumn-layers',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=500&fit=crop',
  },
  {
    tag: 'Skincare Guide',
    title: 'Your 4-Step Evening Ritual',
    description: 'Cleanse, treat, hydrate, protect — the VERAÒ routine for radiant skin.',
    slug: 'evening-ritual',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=500&fit=crop',
  },
  {
    tag: 'Gifting Guide',
    title: 'Curated Gifts Under $100',
    description: 'Thoughtful presents for every person on your list — all from our house.',
    slug: 'gifts-under-100',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&h=500&fit=crop',
  },
]

export const DEALS = [
  { tag: 'Bundle & Save', title: 'Skincare Trio — 20% Off', description: 'Cleanse, serum, and moisturizer. Better together.', slug: 'skincare-trio' },
  { tag: 'Gift With Purchase', title: 'Free Mini Mascara', description: 'On orders over $75 in makeup.', slug: 'gwp-mascara' },
  { tag: 'Seasonal Sale', title: 'End of Season — Up to 40%', description: 'Selected styles across all categories.', slug: 'seasonal-sale' },
  { tag: 'Exclusive Online', title: 'Online-Only Watch Set', description: 'Two timepieces, one exceptional price.', slug: 'watch-set' },
]

export const TRUST_ITEMS = [
  { title: 'Global Shipping', description: 'Free over $100 to 40+ countries' },
  { title: 'Easy Returns', description: '30-day hassle-free returns' },
  { title: 'Secure Payment', description: '256-bit SSL encryption' },
  { title: '100% Authentic', description: 'Every product made by VERAÒ' },
]

export const FOOTER_COLUMNS = [
  {
    title: 'Artificial Jewlery',
    links: [
      { label: 'Earings & Studs', href: '/shop/watches-accessories/jewelry' },
      { label: 'Rings', href: '/shop/watches-accessories/jewelry' },
      { label: 'Bracelets & Bangles', href: '/shop/watches-accessories/jewelry' },
      { label: 'Necklace & Pendants', href: '/shop/watches-accessories/jewelry' },
      { label: 'Mangalsutras', href: '/shop/watches-accessories/jewelry' },
      { label: 'Sets', href: '/shop/watches-accessories/jewelry' },
      { label: 'Gifting', href: '/shop/watches-accessories/jewelry' },
      { label: 'Trendings', href: '/shop/watches-accessories/jewelry' },
    ],
  },
  {
    title: 'Customer Service',
    links: [
      { label: 'Contact Us', href: '/account' },
      { label: 'Shipping Info', href: '/account' },
      { label: 'Returns & Exchanges', href: '/account' },
      { label: 'Size Guide', href: '/account' },
      { label: 'Track Order', href: '/account' },
      { label: 'FAQ', href: '/account' },
    ],
  },
  {
    title: 'VERAÒ Circle',
    links: [
      { label: 'Join the Program', href: '/loyalty' },
      { label: 'Earn Points', href: '/loyalty' },
      { label: 'Redeem Rewards', href: '/loyalty' },
      { label: 'Member Benefits', href: '/loyalty' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'Our Story', href: '/account' },
      { label: 'Sustainability', href: '/account' },
      { label: 'Careers', href: '/account' },
      { label: 'Press', href: '/account' },
      { label: 'Store Locator', href: '/account' },
    ],
  },
]

export const PAYMENT_METHODS = ['Visa', 'MC', 'Amex', 'PayPal', 'Apple Pay']

export const FEATURE_FLAGS = {
  enableAppDownload: true,
  enableLoyalty: true,
  enableQuickAdd: true,
}

export const LOYALTY_TIERS = [
  { name: 'Member', minPoints: 0, benefits: ['Earn 1 pt per $1', 'Birthday reward', 'Early access emails'] },
  { name: 'Insider', minPoints: 500, benefits: ['Earn 1.5 pts per $1', 'Free shipping', 'Exclusive drops'] },
  { name: 'Elite', minPoints: 2000, benefits: ['Earn 2 pts per $1', 'Personal stylist', 'VIP events'] },
]
