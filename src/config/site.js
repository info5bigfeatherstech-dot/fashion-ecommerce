export const SITE_NAME = 'FABUNIQO'
export const SITE_TAGLINE = 'Artificial jewelry for everyday shine.'

export const SITE_CONTACT = {
  email: 'support.fabuniqo@gmail.com ',
  phone: '+91 98765 43210',
  phoneHref: 'tel:+919876543210',
  emailHref: 'mailto:support.fabuniqo@gmail.com ',
  /** Wholesale inquiry form destination */
  wholesaleEmail: 'fabuniqo@gmail.com',
}

export const TOP_BANNER = {
  badge: 'Gift Season',
  headline: 'Get Every Gift with Every Purchase',
  message: 'Free Shipping on orders above ₹1099',
  href: '/shop/women',
  cta: 'Shop now',
}

export const SALE_LIVE = {
  label: 'Sale is live',
  /** Listing loads GET /api/products/all?tags=on-sale */
  href: '/shop/sale',
  tag: 'on-sale',
}

/** Jewelry shop categories — each has its own navbar item and `/shop/:slug` page. */
export const JEWELRY_CATEGORIES = [
  { label: 'Earrings & Studs', slug: 'earrings-studs' },
  { label: 'Rings', slug: 'rings' },
  { label: 'Bracelets & Bangles', slug: 'bracelets-bangles' },
  { label: 'Necklace & Pendants', slug: 'necklace-pendants' },
  { label: 'Mangalsutras', slug: 'mangalsutras' },
  { label: 'Sets', slug: 'sets' },
  { label: 'Gifting', slug: 'gifting' },
]

export const NAV_ITEMS = [
  { label: 'Home', slug: 'home', megaMenu: false },
  ...JEWELRY_CATEGORIES.map(({ label, slug }) => ({
    label,
    slug,
    megaMenu: false,
    href: `/shop/${slug}`,
  })),
]

/** Circular category chips on the homepage (below hero). */
export const HOME_CIRCLE_CATEGORIES = [
  {
    label: 'Earrings',
    href: '/shop/earrings-studs',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    label: 'Necklaces',
    href: '/shop/necklace-pendants',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    label: 'Rings',
    href: '/shop/rings',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557c?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    label: 'Bracelets',
    href: '/shop/bracelets-bangles',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    label: 'Pendants',
    href: '/shop/necklace-pendants',
    image: 'https://images.unsplash.com/photo-1611107683227-e9060eccd846?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    label: 'Sets',
    href: '/shop/sets',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    label: 'Mangalsutras',
    href: '/shop/mangalsutras',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    label: 'Gifting',
    href: '/shop/gifting',
    image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=400&h=400&q=80',
  },
]

export const CATEGORY_STRIP = [
  {
    label: 'Earrings',
    slug: 'women',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&h=900&q=80',
    description: 'Lightweight artificial jewelry for daily and festive looks.',
  },
  {
    label: 'Necklaces',
    slug: 'men',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=700&h=900&q=80',
    description: 'Layered styles and statement pieces that instantly dress up an outfit.',
  },
  {
    label: 'Rings',
    slug: 'kids',
    image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=700&h=900&q=80',
    description: 'Elegant designs made to mix, match, stack, and gift.',
  },
]

export const HERO_SLIDES = [
  {
    id: 'autumn',
    eyebrow: 'Autumn / Winter 2026',
    title: 'The World Wears One House',
    subtitle: 'From Paris ateliers to Seoul streets — every piece designed, made, and owned by VERAÒ.',
    cta: 'Explore New Drops',
    href: '/shop/new-arrivals',
    video: 'https://res.cloudinary.com/kiqmlqnj/video/upload/v1787745696/web_1.mp4',
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

export const LATEST_COLLECTIONS = [
  {
    slug: 'autumn-edit',
    eyebrow: 'Seasonal Edit',
    title: 'Autumn Glow',
    caption: 'Warm gold tones and layered chains for festive evenings and everyday polish.',
    href: '/shop/new-arrivals',
    image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=800&h=1067&q=80',
  },
  {
    slug: 'minimal-luxe',
    eyebrow: 'Everyday Edit',
    title: 'Minimal Luxe',
    caption: 'Understated studs, slim bands, and delicate pendants made for daily wear.',
    href: '/shop/women',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&h=1067&q=80',
  },
  {
    slug: 'statement-night',
    eyebrow: 'Occasion Edit',
    title: 'Statement Night',
    caption: 'Bold earrings and crystal sets designed to turn heads after dark.',
    href: '/shop/women',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&h=1067&q=80',
  },
]

export const SHOP_BY_OCCASION = {
  eyebrow: 'The Atelier',
  title: 'Shop By Occasion',
  panels: [
    {
      id: 'everyday',
      // number: '01',
      label: 'Everyday Elegance',
      title: 'Everyday Elegance',
      href: '/shop/women',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&h=1200&q=80',
      alt: 'Delicate jewelry for everyday wear',
    },
    {
      id: 'office',
      // number: '02',
      label: 'Office',
      title: 'Office',
      href: '/shop/women',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&h=1200&q=80',
      alt: 'Minimal jewelry styled for the workplace',
    },
    {
      id: 'party',
      // number: '03',
      label: 'Party & Night Out Glamour',
      title: 'Party & Night Out Glamour',
      href: '/shop/new-arrivals',
      video: 'https://res.cloudinary.com/kiqmlqnj/video/upload/v1787746151/web_2.mp4',
      image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&h=1200&q=80',
      alt: 'Statement jewelry for evening occasions',
    },
    {
      id: 'festival',
      // number: '04',
      label: 'Festival Radiance',
      title: 'Festival Radiance',
      href: '/shop/women',
      image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=900&h=1200&q=80',
      alt: 'Festive jewelry for celebrations',
    },
    {
      id: 'wedding',
      // number: '05',
      label: 'Wedding Royalty',
      title: 'Wedding Royalty',
      href: '/shop/women',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&h=1200&q=80',
      alt: 'Bridal and wedding jewelry collection',
    },
  ],
}

export const SIGNATURE_JEWELRY = {
  eyebrow: 'Signature Jewelry',
  titleLine1: 'Timeless',
  titleLine2: 'Elegance',
  ctaLabel: 'Explore Collection',
  ctaHref: '/shop/women',
  note: 'Exclusive jewelry series',
  badge: 'Crafted with precision',
  watermark: 'FABUNIQO',
  image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&h=1100&q=80',
  alt: 'FABUNIQO signature necklace and earrings on display',
}

export const CRAFTSMANSHIP_INSPECTION = {
  eyebrow: 'Craftsmanship Inspection',
  titleLead: 'Gold',
  titleAmp: '&',
  titleTrail: 'Diamond',
  heading: 'Artificial Solid Gold Diamonds',
  body: 'Our jewelry pieces are handcrafted by skilled artisans using certified 18K gold and ethically sourced natural diamonds. Every gemstone is carefully selected for brilliance, clarity, and precision setting to ensure timeless elegance.',
  ctaLabel: 'Shop Jewelry',
  ctaHref: '/shop/women',
  image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&h=1000&q=80',
  alt: 'Twisted gold hoop earrings on white stones',
  specs: [
    {
      id: 'clarity',
      label: 'Diamond Clarity',
      value: 'VVS1',
      detail: 'Exceptional Brilliance',
      icon: 'gem',
    },
    {
      id: 'purity',
      label: 'Gold Purity',
      value: '18K (75%)',
      detail: 'Hallmarked Certification',
      icon: 'shield',
    },
  ],
}

export const JEWELRY_ARCHIVE = [
  {
    year: 2022,
    title: 'Heritage Glow',
    description: 'A revival of classic temple motifs — warm gold tones and sculpted florals for festive evenings.',
    href: '/shop/women',
    tagEyebrow: 'Signature Jewelry',
    tagName: 'Temple Bloom Necklace',
    tagPrice: '₹14,250',
    image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=900&h=1200&q=80',
    alt: 'Heritage gold necklace and earrings set',
  },
  {
    year: 2023,
    title: 'Modern Minimal',
    description: 'Clean lines and quiet shine — everyday pieces designed for layering without the noise.',
    href: '/shop/new-arrivals',
    tagEyebrow: 'Signature Jewelry',
    tagName: 'Slim Chain Pendant',
    tagPrice: '₹6,480',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&h=1200&q=80',
    alt: 'Minimal gold pendant necklace',
  },
  {
    year: 2024,
    title: 'Pearl Elegance',
    description: 'Inspired by ocean beauty, this collection introduced graceful pearl necklaces and delicate pendants.',
    href: '/shop/women',
    tagEyebrow: 'Signature Jewelry',
    tagName: 'Traditional Black Beads Set',
    tagPrice: '₹18,780',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&h=1200&q=80',
    alt: 'Traditional black beads jewelry set with pearls',
  },
  {
    year: 2025,
    title: 'Night Sparkle',
    description: 'Statement crystals and mirrored finishes for celebrations that run past midnight.',
    href: '/shop/sale',
    tagEyebrow: 'Signature Jewelry',
    tagName: 'Crystal Drop Earrings',
    tagPrice: '₹9,920',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&h=1200&q=80',
    alt: 'Crystal drop earrings and necklace',
  },
  {
    year: 2026,
    title: 'Atelier Edit',
    description: 'Hand-finished limited runs — the season’s most requested silhouettes, refined and restocked.',
    href: '/shop/new-arrivals',
    tagEyebrow: 'Signature Jewelry',
    tagName: 'Twisted Hoop Pair',
    tagPrice: '₹7,150',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&h=1200&q=80',
    alt: 'Twisted gold hoop earrings',
  },
]

export const AS_SEEN_ON_YOU = {
  instagramHref: 'https://instagram.com/',
  /** Fallback collage only when `/products/featured` returns no images */
  collage: [
    {
      id: 'spot-1',
      image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=700&h=900&q=80',
      alt: 'Gold earrings worn at a festive evening',
      href: '/shop/women',
    },
    {
      id: 'spot-2',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&h=800&q=80',
      alt: 'Layered necklace close-up',
      href: '/shop/new-arrivals',
    },
    {
      id: 'spot-3',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&h=850&q=80',
      alt: 'Pearl and gold jewelry styling',
      href: '/shop/women',
    },
    {
      id: 'spot-4',
      image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=700&h=900&q=80',
      alt: 'Crystal set on display',
      href: '/shop/sale',
    },
    {
      id: 'spot-5',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&h=800&q=80',
      alt: 'Twisted hoop earrings detail',
      href: '/shop/women',
    },
    {
      id: 'spot-6',
      image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=700&h=850&q=80',
      alt: 'Ring stack everyday look',
      href: '/shop/new-arrivals',
    },
    {
      id: 'spot-7',
      image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&h=900&q=80',
      alt: 'Statement earrings portrait',
      href: '/shop/women',
    },
    {
      id: 'spot-8',
      image: 'https://images.unsplash.com/photo-1611107683227-e9060eccd846?auto=format&fit=crop&w=700&h=800&q=80',
      alt: 'Pendant necklace flatlay',
      href: '/shop/women',
    },
    {
      id: 'spot-9',
      image: 'https://images.unsplash.com/photo-1617038260849-41f2d537454b?auto=format&fit=crop&w=700&h=850&q=80',
      alt: 'Gold jewelry on soft fabric',
      href: '/shop/new-arrivals',
    },
  ],
}

export const NEW_ARRIVALS_SLIDES = [
  {
    id: 'work-office',
    title: 'Work & Office',
    itemCount: '85+',
    href: '/shop/women',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&h=900&q=80',
  },
  {
    id: 'festivals',
    title: 'Festivals',
    itemCount: '60+',
    href: '/shop/new-arrivals',
    image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=700&h=900&q=80',
  },
  {
    id: 'party-night',
    title: 'Party & Night Out',
    itemCount: '95+',
    href: '/shop/women',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&h=900&q=80',
  },
  {
    id: 'weddings',
    title: 'Weddings',
    itemCount: '45+',
    href: '/shop/women',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&h=900&q=80',
  },
  {
    id: 'everyday',
    title: 'Everyday Wear',
    itemCount: '70+',
    href: '/shop/new-arrivals',
    image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=700&h=900&q=80',
  },
  {
    id: 'gifting',
    title: 'Gifting',
    itemCount: '55+',
    href: '/shop/sale',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=700&h=900&q=80',
  },
]

export const JEWELLERY_FEST = {
  eyebrow: 'Limited Time',
  title: 'Jewellery Fest',
  offerLabel: 'Limited time offer',
  ctaLabel: 'Explore Fine Jewellery',
  ctaHref: '/shop/sale',
  panelTitle: 'Jewellery for every moment',
  /** Ends at end of the current local day (resets daily). */
  endOfDay: true,
  categories: [
    {
      id: 'everyday',
      title: 'Everyday Minimal Jewellery',
      discount: 20,
      fallbackPrice: 999,
      href: '/shop/women',
    },
    {
      id: 'office',
      title: 'Office Elegance Collection',
      discount: 25,
      fallbackPrice: 1499,
      href: '/shop/new-arrivals',
    },
    {
      id: 'festival',
      title: 'Festival & Wedding Jewellery',
      discount: 30,
      fallbackPrice: 2999,
      href: '/shop/women',
    },
    {
      id: 'party',
      title: 'Party & Night Out Sparkle',
      discount: 35,
      fallbackPrice: 1799,
      href: '/shop/sale',
    },
  ],
}

export const DEEP_CATEGORIES = [
  {
    label: 'Statement Earrings',
    slug: 'new-arrivals',
    offer: 'Min 30% off',
    image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=520&h=720&q=80',
    imageBack: 'https://images.unsplash.com/photo-1617038260849-41f2d537454b?auto=format&fit=crop&w=480&h=680&q=80',
  },
  {
    label: 'Layered Necklaces',
    slug: 'women',
    offer: 'Up to 65% off',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=520&h=720&q=80',
    imageBack: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&w=480&h=680&q=80',
  },
  {
    label: 'Bracelets & Bangles',
    slug: 'men',
    offer: 'Up to 70% off',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=520&h=720&q=80',
    imageBack: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=480&h=680&q=80',
  },
  {
    label: 'Pendants',
    slug: 'innerwear',
    offer: 'Up to 50% off',
    image: 'https://images.unsplash.com/photo-1611107683227-e9060eccd846?auto=format&fit=crop&w=520&h=720&q=80',
    imageBack: 'https://images.unsplash.com/photo-1611652022680-18b16bf7f2b4?auto=format&fit=crop&w=480&h=680&q=80',
  },
  {
    label: 'Jewelry Sets',
    slug: 'kids',
    offer: 'Min 40% off',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=520&h=720&q=80',
    imageBack: 'https://images.unsplash.com/photo-1617038220872-5f3648c8edc5?auto=format&fit=crop&w=480&h=680&q=80',
  },
]

export const EDITORIAL_GUIDES = [
  {
    tag: 'Styling Guide',
    title: 'How to Style Statement Earrings',
    description: 'Easy ways to pair bold artificial jewelry with festive and everyday outfits.',
    slug: 'autumn-layers',
    image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&h=500&fit=crop',
  },
  {
    tag: 'Jewelry Care',
    title: 'Keep Your Jewelry Looking New',
    description: 'Simple care tips to help your artificial jewelry stay bright, stylish, and wearable longer.',
    slug: 'evening-ritual',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=500&fit=crop',
  },
  {
    tag: 'Gifting Guide',
    title: 'Jewelry Gifts They Will Love',
    description: 'Thoughtful earrings, rings, and sets for birthdays, festive wear, and special occasions.',
    slug: 'gifts-under-100',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&h=500&fit=crop',
  },
]

export const DEALS = [
  { tag: 'Bundle & Save', title: 'Jewelry Set Offers', description: 'Save more when you shop matching earrings, necklace, and bracelet sets.', slug: 'skincare-trio' },
  { tag: 'Gift With Purchase', title: 'Free Jewelry Pouch', description: 'On qualifying jewelry orders while stocks last.', slug: 'gwp-mascara' },
  { tag: 'Seasonal Sale', title: 'Festive Collection Sale', description: 'Selected artificial jewelry styles at limited-time prices.', slug: 'seasonal-sale' },
  { tag: 'Exclusive Online', title: 'Online-Only Statement Set', description: 'A curated jewelry combo at a special online price.', slug: 'watch-set' },
]

export const TRUST_ITEMS = [
  { title: 'Fast Shipping', description: 'Reliable delivery for your jewelry orders' },
  { title: 'Easy Returns', description: 'Simple return support on eligible products' },
  { title: 'Secure Payment', description: '256-bit SSL encryption' },
  { title: 'Quality Checked', description: 'Every jewelry piece is checked before dispatch' },
]

export const FOOTER_COLUMNS = [
  {
    title: 'Artificial Jewellery',
    links: JEWELRY_CATEGORIES.map(({ label, slug }) => ({
      label,
      href: `/shop/${slug}`,
    })),
  },
  {
    title: 'Customer Service',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Shipping Info', href: '/account' },
      { label: 'Returns & Exchanges', href: '/account' },
      { label: 'Size Guide', href: '/account' },
      { label: 'Track Order', href: '/account' },
      { label: 'FAQ', href: '/account' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'Our Story', href: '/account' },
      { label: 'Careers', href: '/account' },
    ],
  },
]

export const PAYMENT_METHODS = ['Visa', 'MC', 'Amex', 'PayPal', 'Apple Pay']

export const FEATURE_FLAGS = {
  enableAppDownload: true,
  enableLoyalty: false,
  enableQuickAdd: true,
}
