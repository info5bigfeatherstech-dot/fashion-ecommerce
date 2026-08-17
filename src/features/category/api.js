const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

export const MEGA_MENUS = {
  women: [
    {
      title: 'Clothing',
      href: '/shop/women',
      seeMore: true,
      links: [
        { label: 'New Arrivals', href: '/shop/new-arrivals' },
        { label: 'Dresses', href: '/shop/women/dresses' },
        { label: 'Tops & Blouses', href: '/shop/women/tops' },
        { label: 'Knitwear', href: '/shop/women/knitwear' },
        { label: 'Trousers', href: '/shop/women/trousers' },
        { label: 'Skirts', href: '/shop/women/skirts' },
        { label: 'Jumpsuits', href: '/shop/women/jumpsuits' },
      ],
    },
    {
      title: 'Outerwear',
      href: '/shop/women/outerwear',
      links: [
        { label: 'Coats', href: '/shop/women/coats' },
        { label: 'Blazers', href: '/shop/women/blazers' },
        { label: 'Jackets', href: '/shop/women/jackets' },
        { label: 'Trench', href: '/shop/women/trench' },
        { label: 'Parkas', href: '/shop/women/parkas' },
        { label: 'Capes & Wraps', href: '/shop/women/wraps' },
      ],
    },
    {
      title: 'Innerwear',
      href: '/shop/innerwear',
      seeMore: true,
      links: [
        { label: 'Bras', href: '/shop/innerwear/bras' },
        { label: 'Briefs', href: '/shop/innerwear/briefs' },
        { label: 'Shapewear', href: '/shop/innerwear/shapewear' },
        { label: 'Loungewear', href: '/shop/innerwear/loungewear' },
        { label: 'Sleepwear', href: '/shop/innerwear/sleepwear' },
        { label: 'Socks', href: '/shop/innerwear/socks' },
      ],
    },
    {
      title: 'Shoes',
      href: '/shop/women/shoes',
      links: [
        { label: 'Heels', href: '/shop/women/heels' },
        { label: 'Flats', href: '/shop/women/flats' },
        { label: 'Boots', href: '/shop/women/boots' },
        { label: 'Sneakers', href: '/shop/women/sneakers' },
        { label: 'Sandals', href: '/shop/women/sandals' },
        { label: 'Loafers', href: '/shop/women/loafers' },
      ],
    },
    {
      title: 'Accessories',
      href: '/shop/watches-accessories',
      seeMore: true,
      links: [
        { label: 'Bags', href: '/shop/watches-accessories/bags' },
        { label: 'Jewelry', href: '/shop/watches-accessories/jewelry' },
        { label: 'Belts', href: '/shop/watches-accessories/belts' },
        { label: 'Scarves', href: '/shop/women/scarves' },
        { label: 'Hats', href: '/shop/women/hats' },
        { label: 'Sunglasses', href: '/shop/women/sunglasses' },
      ],
    },
    {
      title: 'Watches',
      href: '/shop/watches-accessories',
      links: [
        { label: 'Classic', href: '/shop/watches-accessories/classic' },
        { label: 'Sport', href: '/shop/watches-accessories/sport' },
        { label: 'Mini', href: '/shop/watches-accessories/mini' },
        { label: 'Straps', href: '/shop/watches-accessories/straps' },
      ],
    },
    {
      title: 'New In',
      href: '/shop/new-arrivals',
      links: [
        { label: 'Just Launched', href: '/shop/new-arrivals' },
        { label: 'Bestsellers', href: '/shop/women' },
        { label: 'Limited Edition', href: '/shop/women' },
        { label: 'The Atelier Collection', href: '/shop/women' },
      ],
    },
    {
      title: 'Edits',
      href: '/shop/women',
      links: [
        { label: 'Autumn Layers', href: '/shop/autumn-layers' },
        { label: 'Workwear', href: '/shop/women' },
        { label: 'Weekend', href: '/shop/women' },
        { label: 'Gifting Guide', href: '/shop/gifts-under-100' },
      ],
    },
    {
      title: 'Sale',
      href: '/shop/sale',
      links: [
        { label: 'Up to 40% Off', href: '/shop/sale' },
        { label: 'Last Chance', href: '/shop/sale' },
        { label: 'Seasonal Sale', href: '/shop/seasonal-sale' },
      ],
    },
  ],
  men: [
    {
      title: 'Clothing',
      href: '/shop/men',
      seeMore: true,
      links: [
        { label: 'New Arrivals', href: '/shop/new-arrivals' },
        { label: 'Shirts', href: '/shop/men/shirts' },
        { label: 'T-Shirts', href: '/shop/men/tshirts' },
        { label: 'Knitwear', href: '/shop/men/knitwear' },
        { label: 'Trousers', href: '/shop/men/trousers' },
        { label: 'Chinos', href: '/shop/men/chinos' },
        { label: 'Denim', href: '/shop/men/denim' },
      ],
    },
    {
      title: 'Outerwear',
      href: '/shop/men/outerwear',
      links: [
        { label: 'Coats', href: '/shop/men/coats' },
        { label: 'Blazers', href: '/shop/men/blazers' },
        { label: 'Jackets', href: '/shop/men/jackets' },
        { label: 'Overshirts', href: '/shop/men/overshirts' },
        { label: 'Parkas', href: '/shop/men/parkas' },
        { label: 'Gilets', href: '/shop/men/gilets' },
      ],
    },
    {
      title: 'Tailoring',
      href: '/shop/men/suits',
      links: [
        { label: 'Suits', href: '/shop/men/suits' },
        { label: 'Formal Shirts', href: '/shop/men/formal-shirts' },
        { label: 'Trousers', href: '/shop/men/trousers' },
        { label: 'Ties', href: '/shop/men/ties' },
        { label: 'Pocket Squares', href: '/shop/men/pocket-squares' },
      ],
    },
    {
      title: 'Innerwear',
      href: '/shop/innerwear',
      seeMore: true,
      links: [
        { label: 'Boxers', href: '/shop/innerwear/boxers' },
        { label: 'Briefs', href: '/shop/innerwear/briefs' },
        { label: 'Undershirts', href: '/shop/innerwear/undershirts' },
        { label: 'Socks', href: '/shop/innerwear/socks' },
        { label: 'Loungewear', href: '/shop/innerwear/loungewear' },
      ],
    },
    {
      title: 'Shoes',
      href: '/shop/men/shoes',
      links: [
        { label: 'Sneakers', href: '/shop/men/sneakers' },
        { label: 'Loafers', href: '/shop/men/loafers' },
        { label: 'Boots', href: '/shop/men/boots' },
        { label: 'Formal', href: '/shop/men/formal-shoes' },
        { label: 'Sandals', href: '/shop/men/sandals' },
      ],
    },
    {
      title: 'Accessories',
      href: '/shop/watches-accessories',
      seeMore: true,
      links: [
        { label: 'Watches', href: '/shop/watches-accessories/watches' },
        { label: 'Bags', href: '/shop/watches-accessories/bags' },
        { label: 'Belts', href: '/shop/watches-accessories/belts' },
        { label: 'Wallets', href: '/shop/watches-accessories/wallets' },
        { label: 'Sunglasses', href: '/shop/men/sunglasses' },
        { label: 'Hats', href: '/shop/men/hats' },
      ],
    },
    {
      title: 'New In',
      href: '/shop/new-arrivals',
      links: [
        { label: 'Just Launched', href: '/shop/new-arrivals' },
        { label: 'Bestsellers', href: '/shop/men' },
        { label: 'Limited Edition', href: '/shop/men' },
        { label: 'The Atelier Collection', href: '/shop/men' },
      ],
    },
    {
      title: 'Edits',
      href: '/shop/men',
      links: [
        { label: 'Work', href: '/shop/men' },
        { label: 'Weekend', href: '/shop/men' },
        { label: 'Gifting Guide', href: '/shop/gifts-under-100' },
      ],
    },
    {
      title: 'Sale',
      href: '/shop/sale',
      links: [
        { label: 'Up to 40% Off', href: '/shop/sale' },
        { label: 'Last Chance', href: '/shop/sale' },
        { label: 'Seasonal Sale', href: '/shop/seasonal-sale' },
      ],
    },
  ],
  kids: [
    {
      title: 'Girls',
      href: '/shop/kids/girls',
      seeMore: true,
      links: [
        { label: 'Dresses', href: '/shop/kids/dresses' },
        { label: 'Tops', href: '/shop/kids/tops' },
        { label: 'Knitwear', href: '/shop/kids/knitwear' },
        { label: 'Trousers', href: '/shop/kids/trousers' },
        { label: 'Skirts', href: '/shop/kids/skirts' },
        { label: 'Outerwear', href: '/shop/kids/outerwear' },
      ],
    },
    {
      title: 'Boys',
      href: '/shop/kids/boys',
      seeMore: true,
      links: [
        { label: 'Shirts', href: '/shop/kids/shirts' },
        { label: 'T-Shirts', href: '/shop/kids/tshirts' },
        { label: 'Knitwear', href: '/shop/kids/knitwear' },
        { label: 'Trousers', href: '/shop/kids/trousers' },
        { label: 'Denim', href: '/shop/kids/denim' },
        { label: 'Outerwear', href: '/shop/kids/outerwear' },
      ],
    },
    {
      title: 'Baby',
      href: '/shop/kids/baby',
      links: [
        { label: 'Newborn', href: '/shop/kids/newborn' },
        { label: 'Bodysuits', href: '/shop/kids/bodysuits' },
        { label: 'Sleepwear', href: '/shop/kids/sleepwear' },
        { label: 'Sets', href: '/shop/kids/sets' },
      ],
    },
    {
      title: 'Shoes',
      href: '/shop/kids/shoes',
      links: [
        { label: 'Sneakers', href: '/shop/kids/sneakers' },
        { label: 'Boots', href: '/shop/kids/boots' },
        { label: 'Sandals', href: '/shop/kids/sandals' },
        { label: 'School', href: '/shop/kids/school' },
      ],
    },
    {
      title: 'Accessories',
      href: '/shop/kids',
      links: [
        { label: 'Bags', href: '/shop/kids/bags' },
        { label: 'Hats', href: '/shop/kids/hats' },
        { label: 'Socks', href: '/shop/innerwear/socks' },
      ],
    },
    {
      title: 'New In',
      href: '/shop/new-arrivals',
      links: [
        { label: 'Just Launched', href: '/shop/new-arrivals' },
        { label: 'Bestsellers', href: '/shop/kids' },
        { label: 'Organic Cotton', href: '/shop/kids' },
      ],
    },
  ],
  beauty: [
    {
      title: 'Face',
      href: '/shop/makeup',
      seeMore: true,
      links: [
        { label: 'Primer', href: '/shop/makeup/primer' },
        { label: 'Foundation', href: '/shop/makeup/face' },
        { label: 'Concealer', href: '/shop/makeup/concealer' },
        { label: 'Powder', href: '/shop/makeup/powder' },
        { label: 'Blush', href: '/shop/makeup/blush' },
        { label: 'Bronzer', href: '/shop/makeup/bronzer' },
        { label: 'Highlighter', href: '/shop/makeup/highlighter' },
      ],
    },
    {
      title: 'Lips',
      href: '/shop/makeup',
      seeMore: true,
      links: [
        { label: 'Lip Primer', href: '/shop/makeup/lip-primer' },
        { label: 'Lipstick', href: '/shop/makeup/lips' },
        { label: 'Liquid Lipstick', href: '/shop/makeup/liquid-lipstick' },
        { label: 'Lip Gloss', href: '/shop/makeup/lip-gloss' },
        { label: 'Lip Balm', href: '/shop/makeup/lip-balm' },
        { label: 'Lip Liner', href: '/shop/makeup/lip-liner' },
      ],
    },
    {
      title: 'Eyes',
      href: '/shop/makeup',
      links: [
        { label: 'Primer', href: '/shop/makeup/eye-primer' },
        { label: 'Shadows', href: '/shop/makeup/eyes' },
        { label: 'Eyeliner', href: '/shop/makeup/eyeliner' },
        { label: 'Mascara', href: '/shop/makeup/mascara' },
        { label: 'False Lashes', href: '/shop/makeup/lashes' },
      ],
    },
    {
      title: 'Eyebrow',
      href: '/shop/makeup',
      links: [
        { label: 'Pencil', href: '/shop/makeup/brow-pencil' },
        { label: 'Gel', href: '/shop/makeup/brow-gel' },
        { label: 'Powder', href: '/shop/makeup/brow-powder' },
        { label: 'Kits', href: '/shop/makeup/brow-kit' },
      ],
    },
    {
      title: 'Palettes',
      href: '/shop/makeup',
      links: [
        { label: 'Shadow Palette', href: '/shop/makeup/palettes' },
        { label: 'Contour Palette', href: '/shop/makeup/contour' },
        { label: 'Face Palette', href: '/shop/makeup/face-palette' },
      ],
    },
    {
      title: 'Accessories',
      href: '/shop/makeup',
      links: [
        { label: 'Brushes', href: '/shop/makeup/brushes' },
        { label: 'Sponges', href: '/shop/makeup/sponges' },
        { label: 'Kits', href: '/shop/makeup/kits' },
      ],
    },
    {
      title: 'Skincare',
      href: '/shop/skincare',
      seeMore: true,
      links: [
        { label: 'Cleansers', href: '/shop/skincare/cleansers' },
        { label: 'Serums', href: '/shop/skincare/serums' },
        { label: 'Moisturizers', href: '/shop/skincare/moisturizers' },
        { label: 'SPF', href: '/shop/skincare/spf' },
        { label: 'Sets', href: '/shop/skincare/sets' },
      ],
    },
    {
      title: 'Fragrance',
      href: '/shop/beauty',
      links: [
        { label: 'For Her', href: '/shop/beauty' },
        { label: 'For Him', href: '/shop/beauty' },
        { label: 'Discovery Sets', href: '/shop/beauty' },
      ],
    },
    {
      title: 'New In',
      href: '/shop/new-arrivals',
      links: [
        { label: 'Just Launched', href: '/shop/new-arrivals' },
        { label: 'Bestsellers', href: '/shop/makeup' },
        { label: 'Gift With Purchase', href: '/shop/gwp-mascara' },
      ],
    },
  ],
}

export const CATEGORY_TREE = {
  women: {
    label: 'Women',
    slug: 'women',
    image: 'https://images.unsplash.com/photo-1483985988355-763728ad1434?w=400&h=500&fit=crop',
    children: [
      { label: 'Dresses', slug: 'dresses' },
      { label: 'Tops & Blouses', slug: 'tops' },
      { label: 'Trousers & Skirts', slug: 'trousers' },
      { label: 'Outerwear', slug: 'outerwear' },
      { label: 'Knitwear', slug: 'knitwear' },
      { label: 'Accessories', slug: 'accessories' },
    ],
  },
  men: {
    label: 'Men',
    slug: 'men',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=500&fit=crop',
    children: [
      { label: 'Shirts', slug: 'shirts' },
      { label: 'Trousers', slug: 'trousers' },
      { label: 'Knitwear', slug: 'knitwear' },
      { label: 'Outerwear', slug: 'outerwear' },
      { label: 'Suits', slug: 'suits' },
    ],
  },
  kids: {
    label: 'Kids',
    slug: 'kids',
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=500&fit=crop',
    children: [
      { label: 'Girls', slug: 'girls' },
      { label: 'Boys', slug: 'boys' },
      { label: 'Baby', slug: 'baby' },
      { label: 'Outerwear', slug: 'outerwear' },
    ],
  },
  beauty: {
    label: 'Beauty',
    slug: 'beauty',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=500&fit=crop',
    children: [
      { label: 'Skincare', slug: 'skincare' },
      { label: 'Makeup', slug: 'makeup' },
      { label: 'Fragrance', slug: 'fragrance' },
      { label: 'Tools', slug: 'tools' },
    ],
  },
  skincare: {
    label: 'Skincare',
    slug: 'skincare',
    image: 'https://images.unsplash.com/photo-1556228578-0d985b112809?w=400&h=500&fit=crop',
    children: [
      { label: 'Cleansers', slug: 'cleansers' },
      { label: 'Serums', slug: 'serums' },
      { label: 'Moisturizers', slug: 'moisturizers' },
      { label: 'SPF', slug: 'spf' },
      { label: 'Sets', slug: 'sets' },
    ],
  },
  makeup: {
    label: 'Makeup',
    slug: 'makeup',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=500&fit=crop',
    children: [
      { label: 'Face', slug: 'face' },
      { label: 'Eyes', slug: 'eyes' },
      { label: 'Lips', slug: 'lips' },
      { label: 'Palettes', slug: 'palettes' },
    ],
  },
  innerwear: {
    label: 'Innerwear',
    slug: 'innerwear',
    image: 'https://images.unsplash.com/photo-1582552936330-448458d661b3?w=400&h=500&fit=crop',
    children: [
      { label: 'Bras', slug: 'bras' },
      { label: 'Briefs', slug: 'briefs' },
      { label: 'Loungewear', slug: 'loungewear' },
      { label: 'Socks', slug: 'socks' },
    ],
  },
  'watches-accessories': {
    label: 'Watches & Accessories',
    slug: 'watches-accessories',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=500&fit=crop',
    children: [
      { label: 'Watches', slug: 'watches' },
      { label: 'Bags', slug: 'bags' },
      { label: 'Jewelry', slug: 'jewelry' },
      { label: 'Belts', slug: 'belts' },
    ],
  },
}

export async function getCategoryTree() {
  await delay()
  return CATEGORY_TREE
}

export async function getCategory(slug) {
  await delay()
  return CATEGORY_TREE[slug] || null
}
