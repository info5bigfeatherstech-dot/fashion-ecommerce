export const MOCK_PRODUCTS = [
  {
    id: '1',
    slug: 'silk-wrap-dress-ink',
    name: 'Silk Wrap Dress',
    category: 'women',
    subcategory: 'dresses',
    price: 189,
    originalPrice: 249,
    badge: 'bestseller',
    rating: 4.8,
    reviewCount: 124,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Ink', 'Ivory'],
    images: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&h=1600&q=80',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&h=1600&q=80',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&h=1600&q=80',
      'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=1200&h=1600&q=80',
    ],
    description: 'Fluid silk wrap dress with a deep V neckline and tie waist. Designed for effortless elegance from day to evening.',
    composition: '100% silk twill. Wrap silhouette with a self-tie waist and midi length. Lined bodice.',
    care: 'Dry clean only. Cool iron on reverse. Store hanging, away from direct sunlight.',
    ingredients: null,
  },
  {
    id: '2',
    slug: 'structured-blazer-charcoal',
    name: 'Structured Wool Blazer',
    category: 'women',
    subcategory: 'outerwear',
    price: 295,
    originalPrice: null,
    badge: 'new',
    rating: 4.6,
    reviewCount: 38,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Charcoal', 'Camel'],
    images: [
      'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop',
    ],
    description: 'Tailored wool blazer with peak lapels and a nipped waist. A wardrobe anchor piece.',
    ingredients: null,
  },
  {
    id: '3',
    slug: 'merino-crew-neck',
    name: 'Merino Crew Neck Sweater',
    category: 'men',
    subcategory: 'knitwear',
    price: 128,
    originalPrice: 160,
    badge: null,
    rating: 4.7,
    reviewCount: 89,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Navy', 'Oat', 'Forest'],
    images: [
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=800&fit=crop',
    ],
    description: 'Fine-gauge merino wool with a relaxed fit. Soft, breathable, and built to last.',
    ingredients: null,
  },
  {
    id: '4',
    slug: 'slim-chino-stone',
    name: 'Slim Fit Chino',
    category: 'men',
    subcategory: 'trousers',
    price: 98,
    originalPrice: null,
    badge: 'bestseller',
    rating: 4.5,
    reviewCount: 201,
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Stone', 'Navy', 'Olive'],
    images: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a51?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Stretch cotton chino with a modern slim silhouette. Your everyday essential.',
    ingredients: null,
  },
  {
    id: '5',
    slug: 'kids-organic-hoodie',
    name: 'Organic Cotton Hoodie',
    category: 'kids',
    subcategory: 'tops',
    price: 45,
    originalPrice: null,
    badge: 'new',
    rating: 4.9,
    reviewCount: 56,
    sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'],
    colors: ['Sage', 'Blush', 'Navy'],
    images: [
      'https://images.unsplash.com/photo-1519238263530-99bdd884dfaa?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=800&fit=crop',
    ],
    description: 'GOTS-certified organic cotton hoodie. Soft enough for all-day play.',
    ingredients: null,
  },
  {
    id: '6',
    slug: 'radiance-serum',
    name: 'Radiance Renewal Serum',
    category: 'skincare',
    subcategory: 'serums',
    price: 68,
    originalPrice: null,
    badge: 'bestseller',
    rating: 4.8,
    reviewCount: 312,
    sizes: ['30ml', '50ml'],
    colors: [],
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1556228578-0d985b112809?w=600&h=800&fit=crop',
    ],
    description: 'A lightweight vitamin C serum that brightens and evens skin tone within 4 weeks.',
    ingredients: 'Vitamin C 15%, Niacinamide, Hyaluronic Acid, Squalane',
  },
  {
    id: '7',
    slug: 'hydra-cloud-cream',
    name: 'Hydra Cloud Cream',
    category: 'skincare',
    subcategory: 'moisturizers',
    price: 52,
    originalPrice: 65,
    badge: null,
    rating: 4.7,
    reviewCount: 178,
    sizes: ['50ml'],
    colors: [],
    images: [
      'https://images.unsplash.com/photo-1617897903246-719323fea049?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=800&fit=crop',
    ],
    description: 'Cloud-light moisturizer with ceramides and peptides for 72-hour hydration.',
    ingredients: 'Ceramides, Peptides, Shea Butter, Aloe Vera',
  },
  {
    id: '8',
    slug: 'velvet-matte-lipstick',
    name: 'Velvet Matte Lipstick',
    category: 'makeup',
    subcategory: 'lips',
    price: 32,
    originalPrice: null,
    badge: 'new',
    rating: 4.6,
    reviewCount: 94,
    sizes: ['3.5g'],
    colors: ['Rosewood', 'Crimson', 'Nude', 'Berry'],
    images: [
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=480&h=480&q=80',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=480&h=480&q=80',
    ],
    description: 'Highly pigmented matte lipstick with a comfortable, non-drying formula.',
    ingredients: 'Jojoba Oil, Vitamin E, Natural Waxes',
  },
  {
    id: '9',
    slug: 'luminous-foundation',
    name: 'Luminous Skin Foundation',
    category: 'makeup',
    subcategory: 'face',
    price: 42,
    originalPrice: null,
    badge: 'bestseller',
    rating: 4.5,
    reviewCount: 267,
    sizes: ['30ml'],
    colors: ['Fair', 'Light', 'Medium', 'Tan', 'Deep'],
    images: [
      'https://images.unsplash.com/photo-1631214524020-51c275a0fb4e?auto=format&fit=crop&w=480&h=480&q=80',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=480&h=480&q=80',
    ],
    description: 'Buildable medium coverage with a natural luminous finish. 24-hour wear.',
    ingredients: 'Hyaluronic Acid, SPF 15, Light-Reflecting Pigments',
  },
  {
    id: '17',
    slug: 'ink-lash-mascara',
    name: 'Ink Lash Mascara',
    category: 'makeup',
    subcategory: 'eyes',
    price: 28,
    originalPrice: null,
    badge: 'bestseller',
    rating: 4.7,
    reviewCount: 186,
    sizes: ['8ml'],
    colors: ['Black', 'Brown'],
    images: [
      'https://images.unsplash.com/photo-1631214524020-51c275a0fb4e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=480&h=480&q=80',
    ],
    description: 'Lengthening mascara with a flexible wand. Soft, buildable, and flake-resistant.',
    ingredients: 'Beeswax, Panthenol, Vitamin B5',
  },
  {
    id: '18',
    slug: 'soft-flush-blush',
    name: 'Soft Flush Blush',
    category: 'makeup',
    subcategory: 'face',
    price: 34,
    originalPrice: null,
    badge: 'new',
    rating: 4.8,
    reviewCount: 112,
    sizes: ['6g'],
    colors: ['Petal', 'Apricot', 'Rose'],
    images: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=480&h=480&q=80',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=480&h=480&q=80',
    ],
    description: 'A sheer cream-powder blush that melts into skin for a natural flush.',
    ingredients: 'Jojoba Oil, Mica, Vitamin E',
  },
  {
    id: '10',
    slug: 'seamless-bralette',
    name: 'Seamless Comfort Bralette',
    category: 'innerwear',
    subcategory: 'bras',
    price: 38,
    originalPrice: null,
    badge: null,
    rating: 4.4,
    reviewCount: 143,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Nude', 'White'],
    images: [
      'https://images.unsplash.com/photo-1582552936330-448458d661b3?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Wire-free seamless bralette with removable pads. All-day comfort, invisible under clothing.',
    ingredients: null,
  },
  {
    id: '11',
    slug: 'classic-diver-watch',
    name: 'Classic Diver Watch',
    category: 'watches-accessories',
    subcategory: 'watches',
    price: 395,
    originalPrice: 495,
    badge: 'limited',
    rating: 4.9,
    reviewCount: 67,
    sizes: ['40mm', '42mm'],
    colors: ['Steel', 'Gold', 'Rose Gold'],
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=800&fit=crop',
    ],
    description: 'Swiss movement diver watch with sapphire crystal. Water resistant to 200m.',
    ingredients: null,
  },
  {
    id: '12',
    slug: 'leather-crossbody',
    name: 'Leather Crossbody Bag',
    category: 'watches-accessories',
    subcategory: 'bags',
    price: 175,
    originalPrice: null,
    badge: 'new',
    rating: 4.7,
    reviewCount: 82,
    sizes: ['One Size'],
    colors: ['Black', 'Tan', 'Burgundy'],
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=800&fit=crop',
    ],
    description: 'Full-grain leather crossbody with adjustable strap and interior card slots.',
    ingredients: null,
  },
  {
    id: '13',
    slug: 'cashmere-scarf',
    name: 'Cashmere Wrap Scarf',
    category: 'women',
    subcategory: 'accessories',
    price: 145,
    originalPrice: null,
    badge: null,
    rating: 4.8,
    reviewCount: 45,
    sizes: ['One Size'],
    colors: ['Camel', 'Grey', 'Black'],
    images: [
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=800&fit=crop',
    ],
    description: 'Pure cashmere wrap scarf. Generously sized for versatile styling.',
    ingredients: null,
  },
  {
    id: '14',
    slug: 'gentle-cleansing-oil',
    name: 'Gentle Cleansing Oil',
    category: 'skincare',
    subcategory: 'cleansers',
    price: 36,
    originalPrice: null,
    badge: 'new',
    rating: 4.6,
    reviewCount: 89,
    sizes: ['150ml'],
    colors: [],
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1617897903246-719323fea049?w=600&h=800&fit=crop',
    ],
    description: 'Melting cleansing oil that removes makeup and impurities without stripping.',
    ingredients: 'Grapeseed Oil, Chamomile Extract, Vitamin E',
  },
  {
    id: '15',
    slug: 'wide-leg-trouser',
    name: 'Wide Leg Trouser',
    category: 'women',
    subcategory: 'trousers',
    price: 118,
    originalPrice: 148,
    badge: 'limited',
    rating: 4.5,
    reviewCount: 73,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Cream'],
    images: [
      'https://images.unsplash.com/photo-1594633312681-425a7b9569e2?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop',
    ],
    description: 'High-waisted wide leg trouser in fluid crepe. A modern silhouette with movement.',
    ingredients: null,
  },
  {
    id: '16',
    slug: 'kids-denim-jacket',
    name: 'Kids Denim Jacket',
    category: 'kids',
    subcategory: 'outerwear',
    price: 58,
    originalPrice: null,
    badge: 'bestseller',
    rating: 4.8,
    reviewCount: 34,
    sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y'],
    colors: ['Light Wash', 'Dark Wash'],
    images: [
      'https://images.unsplash.com/photo-1519238263530-99bdd884dfaa?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1503919005310-48d2295c82e2?w=600&h=800&fit=crop',
    ],
    description: 'Classic denim jacket sized for growing kids. Softened for comfort from day one.',
    ingredients: null,
  },
]

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

export const PRICE_RANGES = [
  { key: 'all', label: 'All prices' },
  { key: '0-50', label: 'Under $50', min: 0, max: 49 },
  { key: '50-100', label: '$50 – $100', min: 50, max: 100 },
  { key: '100-200', label: '$100 – $200', min: 100, max: 200 },
  { key: '200-plus', label: '$200 & above', min: 200 },
]

export const BADGE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'bestseller', label: 'Bestseller' },
  { value: 'limited', label: 'Limited' },
]

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const COLOR_OPTIONS = ['Black', 'Ivory', 'Navy', 'Nude', 'White', 'Camel', 'Charcoal']

export const TOP_CATEGORIES = [
  { label: 'Women', slug: 'women' },
  { label: 'Men', slug: 'men' },
  { label: 'Kids', slug: 'kids' },
  { label: 'Skincare', slug: 'skincare' },
  { label: 'Makeup', slug: 'makeup' },
  { label: 'Innerwear', slug: 'innerwear' },
  { label: 'Watches', slug: 'watches-accessories' },
]

const BEAUTY_CATEGORIES = ['skincare', 'makeup']

export async function getProducts(filters = {}) {
  await delay()
  let results = [...MOCK_PRODUCTS]

  if (filters.category === 'beauty') {
    results = results.filter((p) => BEAUTY_CATEGORIES.includes(p.category))
  } else if (filters.category === 'sale') {
    results = results.filter((p) => p.originalPrice)
  } else if (filters.category === 'new-arrivals') {
    results = results.filter((p) => p.badge === 'new' || p.badge === 'limited')
  } else if (filters.category) {
    results = results.filter((p) => p.category === filters.category)
  }

  if (filters.subcategory) {
    results = results.filter((p) => p.subcategory === filters.subcategory)
  }

  if (filters.badge) {
    results = results.filter((p) => p.badge === filters.badge)
  }

  if (filters.minPrice != null) {
    results = results.filter((p) => p.price >= Number(filters.minPrice))
  }

  if (filters.maxPrice != null) {
    results = results.filter((p) => p.price <= Number(filters.maxPrice))
  }

  if (filters.onSale) {
    results = results.filter((p) => p.originalPrice)
  }

  if (filters.size) {
    results = results.filter((p) => p.sizes?.includes(filters.size))
  }

  if (filters.color) {
    results = results.filter((p) => p.colors?.includes(filters.color))
  }

  if (filters.search) {
    const q = filters.search.toLowerCase()
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q)
    )
  }

  if (filters.sort === 'price-asc') {
    results.sort((a, b) => a.price - b.price)
  } else if (filters.sort === 'price-desc') {
    results.sort((a, b) => b.price - a.price)
  } else if (filters.sort === 'rating') {
    results.sort((a, b) => b.rating - a.rating)
  }

  return { products: results, total: results.length }
}

function withGalleryImages(product) {
  return {
    ...product,
    images: product.images.map((src) => {
      if (!src.includes('images.unsplash.com')) return src
      const base = src.split('?')[0]
      return `${base}?auto=format&fit=crop&w=1200&q=80`
    }),
  }
}

export async function getProductBySlug(slug) {
  await delay()
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug)
  if (!product) throw new Error('Product not found')
  return withGalleryImages(product)
}

export async function getBestsellers() {
  await delay()
  return [...MOCK_PRODUCTS].sort((a, b) => b.reviewCount - a.reviewCount)
}

export async function getNewArrivals() {
  await delay()
  return [...MOCK_PRODUCTS]
}

export async function getBeautyProducts() {
  await delay()
  return MOCK_PRODUCTS.filter((p) => p.category === 'skincare' || p.category === 'makeup')
}
