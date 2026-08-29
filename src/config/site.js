import craftsmanshipImage from '../assets/Heavy Set.png';
import earringsImage from '../assets/Earrings.png';
import braceletsImage from '../assets/(6) Bracelets & Bangles.png';
import chokerNecklaceImage from '../assets/(2) Green Beads Stone Choker Necklace with Earrings Set for Party Wedding Jewellery (1).png';
import giftBoxImage from '../assets/(10) Build A Gift Box.png';
import starting29Image from '../assets/Artificial Jewellery Starting 29 rs only  at FabUniqo.png';

export const SITE_NAME = 'FABUNIQO'
export const SITE_TAGLINE = 'Artificial jewelry for everyday shine.'

export const SITE_CONTACT = {
  email: 'support.fabuniqo@gmail.com',
  phone: '+91 98765 43210',
  phoneHref: 'tel:+919876543210',
  emailHref: 'mailto:support.fabuniqo@gmail.com',
  /** Form submissions (wholesale + contact) — must be activated on FormSubmit */
  wholesaleEmail: 'fabuniqo@gmail.com',
  contactEmail: 'fabuniqo@gmail.com',
}

export const TOP_BANNER = {
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

export const NAV_ITEMS = [
  { label: 'Home', slug: 'home', megaMenu: false },
]

/** @deprecated Prefer API categories via useHeaderNavItems / useFooterShopLinks */
export const JEWELRY_CATEGORIES = [
  { label: 'Earrings & Studs', slug: 'earrings-studs' },
  { label: 'Rings', slug: 'rings' },
  { label: 'Bracelets & Bangles', slug: 'bracelets-bangles' },
  { label: 'Necklace & Pendants', slug: 'necklace-pendants' },
  { label: 'Mangalsutras', slug: 'mangalsutras' },
  { label: 'Sets', slug: 'sets' },
  { label: 'Gifting', slug: 'gifting' },
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
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=400&h=400&q=80',
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
    id: 'fabuniqo-main',
    eyebrow: 'FABUNIQO — Fashion Uniquely Yours',
    title: 'Style That Speaks Your Language',
    subtitle: 'From trendsetting Korean & Western daily wear to gorgeous ethnic sets — discover your perfect piece.',
    cta: 'Explore New Drops',
    href: '/shop/new-arrivals',
    video: 'https://res.cloudinary.com/kiqmlqnj/video/upload/v1787745696/web_1.mp4',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&h=800&q=80',
    alt: 'FABUNIQO Jewelry Collection — Trendsetting Korean & Western designs',
    // features: [
    //   {
    //     text: 'Trendsetting Korean & Western Daily Wear',
    //   },
    //   {
    //     text: 'Premium Antique & Oxidized Statement Jewelry',
    //   },
    //   {
    //     text: 'Gorgeous Ethnic Sets & Mangalsutras',
    //   },
    //   {
    //     text: 'Starting at Just ₹29',
    //     subtext: 'Unbeatable Wholesale & Retail Styles',
    //     highlight: true,
    //   },
    // ],
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
      href: '/shop/earrings-studs',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&h=1200&q=80',
      video: 'https://res.cloudinary.com/kiqmlqnj/video/upload/v1787820656/FabUniqo.everyday_elegance_3.mp4',
      alt: 'Delicate jewelry for everyday wear',
    },
    {
      id: 'office',
      // number: '02',
      label: 'Office',
      title: 'Office',
      href: '/shop/necklace-pendants',
      video: 'https://res.cloudinary.com/kiqmlqnj/video/upload/v1787820660/FabUniqo.office_2.mp4',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&h=1200&q=80',
      alt: 'Minimal jewelry styled for the workplace',
    },
    {
      id: 'party',
      // number: '03',
      label: 'Party & Night Out Glamour',
      title: 'Party & Night Out Glamour',
      href: '/shop/bracelets-bangles',
      video: 'https://res.cloudinary.com/kiqmlqnj/video/upload/v1787820648/party_Night_Out_Glamour_6.mp4',
      image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&h=1200&q=80',
      alt: 'Statement jewelry for evening occasions',
    },
    {
      id: 'festival',
      // number: '04',
      label: 'Festival Radiance',
      title: 'Festival Radiance',
      href: '/shop/earrings-studs',
      image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=900&h=1200&q=80',
      video: 'https://res.cloudinary.com/kiqmlqnj/video/upload/v1787820653/FabUniqo.Festive_Radiance_1.mp4',
      alt: 'Festive jewelry for celebrations',
    },
    {
      id: 'wedding',
      // number: '05',
      label: 'Wedding Royalty',
      title: 'Wedding Royalty',
      href: '/shop/sets',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&h=1200&q=80',
      video: 'https://res.cloudinary.com/kiqmlqnj/video/upload/v1787820648/FabUniqo.Wedding_Royality_9.mp4',
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
  eyebrow: 'DESIGNED TO SHINE',
  titleLead: 'Luxury Fashion Jewelry ',
  // titleAmp: '&',
  // titleTrail: 'Jewellery',
  heading: 'PREMIUM CRAFTSMANSHIP | FESTIVE READY',
  body: 'Our jewelry pieces are handcrafted by skilled artisans using high-quality alloys, premium stones, and fine polishes. Every piece is carefully selected to ensure everlasting shine, comfort, and timeless elegance for your special occasion.',
  ctaLabel: 'SHOP COLLECTION',
  ctaHref: '/shop/women',
  image: craftsmanshipImage,
  alt: 'Twisted gold hoop earrings on white stones',
  specs: [
    {
      id: 'clarity',
      label: 'Premium Stones ',
      value: 'High-Grade Zircon & Kundan',
      // detail: 'STYLES FOR EVERY LOOK',
      icon: 'gem',
    },
    {
      id: 'purity',
      label: 'Long lasting Polish',
      value: 'Anti-Tamish & Skin Friendly',
      // detail: 'JEWELLERY FOR EVERY OCCASION',
      icon: 'shield',
    },
  ],
}

export const JEWELRY_ARCHIVE = [
  // {
  //   year: 2022,
  //   title: 'Heritage Glow',
  //   description: 'A revival of classic temple motifs — warm gold tones and sculpted florals for festive evenings.',
  //   href: '/shop/women',
  //   tagEyebrow: 'Signature Jewelry',
  //   tagName: 'Temple Bloom Necklace',
  //   tagPrice: '₹14,250',
  //   image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=900&h=1200&q=80',
  //   alt: 'Heritage gold necklace and earrings set',
  // },
  // {
  //   year: 2023,
  //   title: 'Modern Minimal',
  //   description: 'Clean lines and quiet shine — everyday pieces designed for layering without the noise.',
  //   href: '/shop/new-arrivals',
  //   tagEyebrow: 'Signature Jewelry',
  //   tagName: 'Slim Chain Pendant',
  //   tagPrice: '₹6,480',
  //   image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&h=1200&q=80',
  //   alt: 'Minimal gold pendant necklace',
  // },
  {
    // year: 2024,
    title: 'Timeless Elegance',
    description: 'Discover jewellery that complements every mood, outfit and occasion — from everyday essentials to statement pieces made to stand out.',
    href: '/shop/women',
    tagEyebrow: 'EVERYDAY GLAM',
    tagName: 'Trendy Daily Wear Studs',
    tagPrice: 'Starting from ₹29',
    image: starting29Image,
    alt: 'Artificial Jewellery Starting 29 rs only at FabUniqo',
  },
  // {
  //   year: 2025,
  //   title: 'Night Sparkle',
  //   description: 'Statement crystals and mirrored finishes for celebrations that run past midnight.',
  //   href: '/shop/sale',
  //   tagEyebrow: 'Signature Jewelry',
  //   tagName: 'Crystal Drop Earrings',
  //   tagPrice: '₹9,920',
  //   image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&h=1200&q=80',
  //   alt: 'Crystal drop earrings and necklace',
  // },
  // {
  //   year: 2026,
  //   title: 'Atelier Edit',
  //   description: 'Hand-finished limited runs — the season’s most requested silhouettes, refined and restocked.',
  //   href: '/shop/new-arrivals',
  //   tagEyebrow: 'Signature Jewelry',
  //   tagName: 'Twisted Hoop Pair',
  //   tagPrice: '₹7,150',
  //   image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&h=1200&q=80',
  //   alt: 'Twisted gold hoop earrings',
  // },
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
  title: 'Jewellery Edit',
  offerLabel: 'SPECIAL LAUNCH OFFER',
  ctaLabel: 'Exclusive Offers',
  ctaHref: '/shop/sale',
  panelTitle: 'Jewellery for every moment',
  /** Ends at end of the current local day (resets daily). */
  endOfDay: true,
  categories: [
    {
      id: 'everyday',
      slug: 'everyday',
      title: 'Everyday Earrings & Studs Elegant styles for every day',
      productName: 'Everyday Earrings & Studs',
      fallbackPrice: 29,
      href: '/product/everyday',
      image: earringsImage,
    },
    {
      id: 'office',
      slug: 'office',
      title: 'Rings & Bracelets Minimal styles, made to shine',
      productName: 'Rings & Bracelets Minimal',
      fallbackPrice: 49,
      href: '/product/office',
      image: braceletsImage,
    },
    {
      id: 'festival',
      slug: 'festival',
      title: 'Necklaces & Pendants Statement styles for every occasion',
      productName: 'Necklaces & Pendants Statement',
      fallbackPrice: 69,
      href: '/product/festival',
      image: chokerNecklaceImage,
    },
    {
      id: 'party',
      slug: 'party',
      title: 'Jewellery Sets & Gifting Perfect picks for every celebration',
      productName: 'Jewellery Sets & Gifting',
      fallbackPrice: 199,
      href: '/product/party',
      image: giftBoxImage,
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

/** Static footer columns (shop categories come from the categories API). */
export const FOOTER_COLUMNS = [
  {
    title: 'Customer Service',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Shipping Info', href: '/policies/shipping-policy' },
      { label: 'Returns & Exchanges', href: '/policies/return-refund' },
      { label: 'Track Order', href: '/account/orders' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { label: 'Return & Refund', href: '/policies/return-refund' },
      { label: 'Order Cancellation Policy', href: '/policies/order-cancellation' },
      { label: 'Privacy Policy', href: '/policies/privacy-policy' },
      { label: 'Shipping Policy', href: '/policies/shipping-policy' },
      { label: 'Terms & Conditions', href: '/policies/terms-conditions' },
    ],
  },
]

export const PAYMENT_METHODS = ['Visa', 'MC', 'Amex', 'PayPal', 'Apple Pay']

export const FEATURE_FLAGS = {
  enableAppDownload: true,
  enableLoyalty: false,
  enableQuickAdd: true,
}
