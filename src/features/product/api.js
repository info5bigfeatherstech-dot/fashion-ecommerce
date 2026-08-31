import { http } from '@/api/http'
import { API_ENDPOINTS, PRODUCT_CATALOG_MAX_PAGES, PRODUCT_CATALOG_PAGE_SIZE } from '@/api/endpoints'
import { ApiError } from '@/api/errors'
import { formatDiscount } from '@/lib/utils'
import { extractProduct, extractProductList, mapPagination, mapProductList } from './mappers'
import earringsImage from '@/assets/Earrings.png'
import craftsmanshipImage from '@/assets/Heavy Set.png'
import braceletsImage from '@/assets/(6) Bracelets & Bangles.png'
import chokerNecklaceImage from '@/assets/(2) Green Beads Stone Choker Necklace with Earrings Set for Party Wedding Jewellery (1).png'
import giftBoxImage from '@/assets/(10) Build A Gift Box.png'

export const FEST_PRODUCTS = [
  {
    id: 'fest-everyday',
    slug: 'everyday',
    aliases: ['everyday', 'everyday-earrings-studs'],
    name: 'Everyday Earrings & Studs',
    title: 'Everyday Earrings & Studs',
    displayTitle: 'Everyday Earrings & Studs — Elegant Styles for Every Day',
    price: 29,
    originalPrice: 59,
    discountPct: 50,
    category: 'earrings-studs',
    categoryLabel: 'Earrings & Studs',
    image: earringsImage,
    images: [
      earringsImage,
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=800&h=1000&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&h=1000&q=80',
    ],
    description:
      'Discover beautifully crafted everyday earrings and studs designed to elevate your style effortlessly. Made from hypoallergenic, skin-friendly alloy with high-shine polish that lasts.',
    rating: 4.9,
    reviewCount: 142,
    soldCount: 380,
    inStock: true,
    isFeatured: true,
    tags: ['everyday', 'earrings', 'bestseller', 'on-sale'],
    optionGroups: [
      {
        key: 'Color',
        label: 'Color',
        values: ['Gold', 'Silver', 'Rose Gold'],
        isColor: true,
      },
    ],
    variants: [
      { id: 'fest-everyday-gold', title: 'Everyday Earrings & Studs - Gold', price: 29, originalPrice: 59, inStock: true, attributes: [{ key: 'Color', value: 'Gold' }] },
      { id: 'fest-everyday-silver', title: 'Everyday Earrings & Studs - Silver', price: 29, originalPrice: 59, inStock: true, attributes: [{ key: 'Color', value: 'Silver' }] },
      { id: 'fest-everyday-rosegold', title: 'Everyday Earrings & Studs - Rose Gold', price: 29, originalPrice: 59, inStock: true, attributes: [{ key: 'Color', value: 'Rose Gold' }] },
    ],
    highlights: [
      'Hypoallergenic & nickel-free materials',
      'Lightweight design for all-day comfort',
      'High-shine protective anti-tarnish coating',
      'Includes signature FabUniqo luxury pouch',
    ],
  },
  {
    id: 'fest-office',
    slug: 'office',
    aliases: ['office', 'rings-bracelets-minimal'],
    name: 'Rings & Bracelets Minimal',
    title: 'Rings & Bracelets Minimal',
    displayTitle: 'Rings & Bracelets — Minimal Styles, Made to Shine',
    price: 49,
    originalPrice: 99,
    discountPct: 50,
    category: 'rings',
    categoryLabel: 'Rings & Bracelets',
    image: braceletsImage,
    images: [
      braceletsImage,
      'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=800&h=1000&q=80',
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&h=1000&q=80',
    ],
    description:
      'Sleek, minimal rings and delicate stackable bracelets designed for office polish and subtle shine. Smooth inner fit and tarnish-resistant finish.',
    rating: 4.8,
    reviewCount: 96,
    soldCount: 240,
    inStock: true,
    isFeatured: true,
    tags: ['office', 'rings', 'bracelets', 'minimal', 'on-sale'],
    optionGroups: [
      {
        key: 'Finish',
        label: 'Finish',
        values: ['Classic Gold', 'Polished Silver'],
        isColor: true,
      },
    ],
    variants: [
      { id: 'fest-office-gold', title: 'Rings & Bracelets Minimal - Classic Gold', price: 49, originalPrice: 99, inStock: true, attributes: [{ key: 'Finish', value: 'Classic Gold' }] },
      { id: 'fest-office-silver', title: 'Rings & Bracelets Minimal - Polished Silver', price: 49, originalPrice: 99, inStock: true, attributes: [{ key: 'Finish', value: 'Polished Silver' }] },
    ],
    highlights: [
      'Minimalist design built for everyday office wear',
      'Resistant to tarnishing and daily moisture',
      'Smooth inner comfort fit design',
    ],
  },
  {
    id: 'fest-festival',
    slug: 'festival',
    aliases: ['festival', 'necklaces-pendants-statement'],
    name: 'Necklaces & Pendants Statement',
    title: 'Necklaces & Pendants Statement',
    displayTitle: 'Necklaces & Pendants — Statement Styles for Every Occasion',
    price: 69,
    originalPrice: 139,
    discountPct: 50,
    category: 'necklace-pendants',
    categoryLabel: 'Necklaces & Pendants',
    image: chokerNecklaceImage,
    images: [
      chokerNecklaceImage,
      'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&h=1000&q=80',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&h=1000&q=80',
    ],
    description:
      'Hand-finished statement green beads stone choker necklace and matching earrings set. Made to turn heads at festivals, dates, weddings, and family celebrations.',
    rating: 4.9,
    reviewCount: 115,
    soldCount: 310,
    inStock: true,
    isFeatured: true,
    tags: ['festival', 'necklaces', 'pendants', 'statement', 'on-sale'],
    optionGroups: [
      {
        key: 'Chain Length',
        label: 'Chain Length',
        values: ['16 inch', '18 inch', '20 inch'],
        isSize: true,
      },
    ],
    variants: [
      { id: 'fest-festival-16', title: 'Necklaces & Pendants Statement - 16 inch', price: 69, originalPrice: 139, inStock: true, attributes: [{ key: 'Chain Length', value: '16 inch' }] },
      { id: 'fest-festival-18', title: 'Necklaces & Pendants Statement - 18 inch', price: 69, originalPrice: 139, inStock: true, attributes: [{ key: 'Chain Length', value: '18 inch' }] },
      { id: 'fest-festival-20', title: 'Necklaces & Pendants Statement - 20 inch', price: 69, originalPrice: 139, inStock: true, attributes: [{ key: 'Chain Length', value: '20 inch' }] },
    ],
    highlights: [
      'Intricate craftsmanship with sparkling stones and green beads',
      'Adjustable chain extension for custom drop height',
      'Ideal for festive occasions, weddings, and gifting',
    ],
  },
  {
    id: 'fest-party',
    slug: 'party',
    aliases: ['party', 'jewellery-sets-gifting'],
    name: 'Jewellery Sets & Gifting',
    title: 'Jewellery Sets & Gifting',
    displayTitle: 'Jewellery Sets & Gifting — Perfect Picks for Every Celebration',
    price: 199,
    originalPrice: 399,
    discountPct: 50,
    category: 'sets',
    categoryLabel: 'Jewellery Sets & Gifting',
    image: giftBoxImage,
    images: [
      giftBoxImage,
      craftsmanshipImage,
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&h=1000&q=80',
    ],
    description:
      'Complete luxury build-a-gift box jewellery set including statement piece, matching accessories, and premium packaging. Comes ready for weddings, festive galas, and special moments.',
    rating: 5.0,
    reviewCount: 210,
    soldCount: 520,
    inStock: true,
    isFeatured: true,
    tags: ['party', 'gifting', 'sets', 'wedding', 'on-sale'],
    optionGroups: [
      {
        key: 'Color',
        label: 'Color',
        values: ['Royal Gold', 'Emerald Green Gold', 'Ruby Red Gold'],
        isColor: true,
      },
    ],
    variants: [
      { id: 'fest-party-gold', title: 'Jewellery Sets & Gifting - Royal Gold', price: 199, originalPrice: 399, inStock: true, attributes: [{ key: 'Color', value: 'Royal Gold' }] },
      { id: 'fest-party-emerald', title: 'Jewellery Sets & Gifting - Emerald Green Gold', price: 199, originalPrice: 399, inStock: true, attributes: [{ key: 'Color', value: 'Emerald Green Gold' }] },
      { id: 'fest-party-ruby', title: 'Jewellery Sets & Gifting - Ruby Red Gold', price: 199, originalPrice: 399, inStock: true, attributes: [{ key: 'Color', value: 'Ruby Red Gold' }] },
    ],
    highlights: [
      'Complete set with matching necklace, earrings, and bracelet',
      'Packaged in an elegant velvet gift box ready for gifting',
      'Premium craft quality with anti-tarnish protective coating',
    ],
  },
]

function getFestProductBySlug(slug) {
  const norm = String(slug || '').trim().toLowerCase()
  if (!norm) return null
  return (
    FEST_PRODUCTS.find(
      (p) =>
        p.slug.toLowerCase() === norm ||
        p.id.toLowerCase() === norm ||
        (p.aliases && p.aliases.some((a) => a.toLowerCase() === norm))
    ) || null
  )
}

export {
  PRICE_RANGES,
  BADGE_OPTIONS,
  SIZE_OPTIONS,
  COLOR_OPTIONS,
  MAIN_COLOR_OPTIONS,
  PLATING_OPTIONS,
  DISCOUNT_OPTIONS,
  TOP_CATEGORIES,
} from './constants'

const BEAUTY_CATEGORIES = new Set(['skincare', 'makeup', 'beauty', 'beauty-and-personal-care'])
const FOOTWEAR_SUBS = new Set(['sneakers', 'sandals', 'heels', 'boots', 'loafers', 'flats', 'shoes'])
const SPECIAL_CATEGORIES = new Set(['sale', 'new-arrivals', 'beauty', 'footwear', 'bags'])
const CATALOG_TTL_MS = 1000 * 60
const FEATURED_TTL_MS = 1000 * 60

let catalogCache = null
let catalogCachedAt = 0
let catalogInFlight = null

let featuredCache = null
let featuredCacheAt = 0
let featuredCacheLimit = null
let featuredInFlight = null

function matchesSearch(product, query) {
  const haystack = [
    product.name,
    product.title,
    product.description,
    product.brand,
    product.category,
    product.categoryLabel,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

function matchesAttrValue(values = [], target) {
  const needle = String(target || '').trim().toLowerCase()
  if (!needle) return true
  return values.some((value) => String(value).trim().toLowerCase() === needle)
}

function productDiscountPct(product) {
  return formatDiscount(product.originalPrice, product.price) || 0
}

/**
 * Query params for GET /products/all (and category) filter support.
 * Backend filters by these keys when provided.
 */
export function buildProductQueryParams(filters = {}) {
  const params = {}

  if (filters.minPrice != null && filters.minPrice !== '') {
    params.minPrice = Number(filters.minPrice)
  }
  if (filters.maxPrice != null && filters.maxPrice !== '') {
    params.maxPrice = Number(filters.maxPrice)
  }
  if (filters.color) {
    params.color = filters.color
    params.mainColor = filters.color
  }
  if (filters.plating) {
    params.plating = filters.plating
    params.metalColor = filters.plating
  }
  if (filters.minDiscount != null && filters.minDiscount !== '') {
    params.minDiscount = Number(filters.minDiscount)
    params.discount = Number(filters.minDiscount)
  }

  const tags = []
  if (filters.tags) tags.push(String(filters.tags))
  if (filters.discountTag) tags.push(String(filters.discountTag))
  if (filters.onSale) tags.push('on-sale')
  if (tags.length) {
    params.tags = [...new Set(tags)].join(',')
  }

  if (filters.sort) params.sort = filters.sort
  if (filters.page) params.page = filters.page
  if (filters.limit) params.limit = filters.limit

  return params
}

function hasServerFilterParams(params = {}) {
  return Boolean(
    params.minPrice != null ||
    params.maxPrice != null ||
    params.color ||
    params.mainColor ||
    params.plating ||
    params.metalColor ||
    params.minDiscount != null ||
    params.discount != null ||
    params.tags
  )
}

function applyProductFilters(products, filters = {}) {
  let results = products

  if (filters.category === 'beauty') {
    results = results.filter((product) => BEAUTY_CATEGORIES.has(product.category))
  } else if (filters.category === 'sale') {
    results = results.filter((product) => {
      const tags = Array.isArray(product.tags) ? product.tags : []
      return tags.includes('on-sale') || product.badge === 'sale' || Boolean(product.originalPrice)
    })
  } else if (filters.category === 'new-arrivals') {
    results = results.filter((product) => product.badge === 'new' || product.badge === 'sale')
  } else if (filters.category === 'footwear') {
    results = results.filter((product) => FOOTWEAR_SUBS.has(product.subcategory))
  } else if (filters.category === 'bags') {
    results = results.filter((product) => product.subcategory === 'bags' || product.category === 'bags')
  } else if (filters.category && !SPECIAL_CATEGORIES.has(filters.category)) {
    const category = String(filters.category).toLowerCase()
    const matched = results.filter(
      (product) =>
        product.category === category ||
        product.categoryLabel?.toLowerCase() === category ||
        product.categoryLabel?.toLowerCase().includes(category)
    )
    if (matched.length) results = matched
  }

  if (filters.subcategory) {
    const subcategory = String(filters.subcategory).toLowerCase()
    const matched = results.filter(
      (product) =>
        product.subcategory === subcategory ||
        product.sizes.some((value) => value.toLowerCase() === subcategory) ||
        product.colors.some((value) => value.toLowerCase() === subcategory)
    )
    if (matched.length) results = matched
  }

  if (filters.badge) {
    results = results.filter((product) => product.badge === filters.badge)
  }

  if (filters.minPrice != null) {
    results = results.filter((product) => product.price >= Number(filters.minPrice))
  }

  if (filters.maxPrice != null) {
    results = results.filter((product) => product.price <= Number(filters.maxPrice))
  }

  if (filters.onSale) {
    results = results.filter((product) => product.originalPrice)
  }

  if (filters.size) {
    results = results.filter((product) => product.sizes.includes(filters.size))
  }

  if (filters.color) {
    results = results.filter((product) => matchesAttrValue(product.colors, filters.color))
  }

  if (filters.plating) {
    results = results.filter((product) => matchesAttrValue(product.platings || [], filters.plating))
  }

  if (filters.minDiscount != null) {
    const min = Number(filters.minDiscount)
    results = results.filter((product) => productDiscountPct(product) >= min)
  }

  if (filters.discountTag) {
    const tag = String(filters.discountTag).toLowerCase()
    results = results.filter((product) =>
      (product.tags || []).some((item) => String(item).toLowerCase() === tag)
    )
  }

  if (filters.search) {
    const query = String(filters.search).trim().toLowerCase()
    if (query) results = results.filter((product) => matchesSearch(product, query))
  }

  if (filters.sort === 'price-asc') {
    results = [...results].sort((a, b) => a.price - b.price)
  } else if (filters.sort === 'price-desc') {
    results = [...results].sort((a, b) => b.price - a.price)
  } else if (filters.sort === 'rating') {
    results = [...results].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
  } else if (filters.sort === 'newest') {
    results = [...results].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })
  }

  return results
}

export async function fetchProductsPage(
  { page = 1, limit = PRODUCT_CATALOG_PAGE_SIZE, ...params } = {},
  { signal } = {}
) {
  const payload = await http.get(API_ENDPOINTS.products.all, {
    params: { page, limit, ...params },
    signal,
  })

  const products = mapProductList(payload.products)
  const pagination = mapPagination(payload.pagination, products.length)

  return { products, pagination, raw: payload }
}

/**
 * Products belonging to a category slug.
 * GET /api/products/category/:slug
 */
export async function getProductsByCategory(slug, { page = 1, limit = 50, signal, ...params } = {}) {
  if (!slug) {
    return { products: [], total: 0, pagination: mapPagination(null) }
  }

  try {
    const payload = await http.get(API_ENDPOINTS.products.byCategory(slug), {
      params: { page, limit, ...params },
      signal,
    })

    const products = extractProductList(payload)
    if (products.length > 0) {
      const pagination = mapPagination(payload?.pagination ?? payload?.data?.pagination, products.length)
      return {
        products,
        total: pagination.total || products.length,
        pagination,
        raw: payload,
      }
    }
  } catch (err) {
    // API call failed or returned empty
  }

  const cleanSlug = String(slug).toLowerCase()
  const localMatching = FEST_PRODUCTS.filter(
    (p) =>
      p.category === slug ||
      (p.aliases && p.aliases.includes(slug)) ||
      (p.tags && p.tags.includes(slug)) ||
      String(p.categoryLabel || '').toLowerCase().includes(cleanSlug)
  )

  const products = localMatching.slice((page - 1) * limit, page * limit)
  return {
    products,
    total: localMatching.length,
    pagination: mapPagination(null, localMatching.length),
  }
}

/**
 * Related products for a product slug (shown on PDP).
 * GET /api/products/:slug/related
 * Falls back to category → featured → catalog so the PDP section is rarely empty.
 */
export async function getRelatedProducts(slug, { signal, limit = 8, categorySlug } = {}) {
  if (!slug) return []

  const excludeCurrent = (list = []) =>
    list
      .filter((product) => {
        if (!product) return false
        if (product.slug != null && String(product.slug) === String(slug)) return false
        return true
      })
      .slice(0, limit)

  let related = []
  try {
    const payload = await http.get(API_ENDPOINTS.products.related(slug), {
      params: { limit },
      signal,
    })
    related = excludeCurrent(extractProductList(payload))
  } catch {
    related = []
  }
  if (related.length) return related

  if (categorySlug && categorySlug !== 'uncategorized') {
    try {
      const { products } = await getProductsByCategory(categorySlug, {
        page: 1,
        limit: Math.max(limit + 4, 16),
        signal,
      })
      related = excludeCurrent(products)
      if (related.length) return related
    } catch {
      // continue to broader fallbacks
    }
  }

  try {
    const featured = await getFeaturedProducts({ limit: Math.max(limit + 4, 12) })
    related = excludeCurrent(featured)
    if (related.length) return related
  } catch {
    // continue
  }

  try {
    const { products } = await getProductCatalog()
    return excludeCurrent(products)
  } catch {
    return []
  }
}

async function fetchFullCatalog() {
  const products = []
  let page = 1
  let pagination = mapPagination(null)

  do {
    const result = await fetchProductsPage({ page, limit: PRODUCT_CATALOG_PAGE_SIZE })
    products.push(...result.products)
    pagination = result.pagination
    page += 1
  } while (pagination.hasNextPage && page <= PRODUCT_CATALOG_MAX_PAGES)

  return {
    products,
    pagination: {
      ...pagination,
      total: pagination.total || products.length,
    },
  }
}

export async function getProductCatalog({ force = false } = {}) {
  const now = Date.now()
  if (!force && catalogCache && now - catalogCachedAt < CATALOG_TTL_MS) {
    return catalogCache
  }

  if (!catalogInFlight) {
    catalogInFlight = fetchFullCatalog()
      .then((result) => {
        catalogCache = result
        catalogCachedAt = Date.now()
        return result
      })
      .finally(() => {
        catalogInFlight = null
      })
  }

  return catalogInFlight
}

/**
 * Server-side product search.
 * GET /api/products/search?q=productName
 */
export async function searchProducts(query, { page = 1, limit = 12, signal } = {}) {
  const q = String(query || '').trim()
  if (q.length < 2) {
    return {
      products: [],
      total: 0,
      pagination: mapPagination({ total: 0, page: 1, limit }, 0),
    }
  }

  const payload = await http.get(API_ENDPOINTS.products.search, {
    params: { q, page, limit },
    signal,
  })

  const products = extractProductList(payload)
  const pagination = mapPagination(
    {
      total: payload?.total ?? payload?.pagination?.total,
      page: payload?.page ?? payload?.pagination?.page ?? page,
      limit: payload?.limit ?? payload?.pagination?.limit ?? limit,
      totalPages: payload?.totalPages ?? payload?.pagination?.totalPages,
      hasNextPage: payload?.hasNextPage ?? payload?.pagination?.hasNextPage,
      hasPrevPage: payload?.hasPrevPage ?? payload?.pagination?.hasPrevPage,
    },
    products.length
  )

  return {
    products,
    total: pagination.total || products.length,
    pagination,
    raw: payload,
  }
}

/**
 * Products filtered by marketing tag (ProductTag collection on backend).
 * GET /api/products/all?tags=today-arrival&page=1&limit=25
 */
export async function getProductsByTag(tag, { page = 1, limit = 25, signal, cacheBust = false, ...params } = {}) {
  const normalized = String(tag || '').trim().toLowerCase().replace(/_/g, '-')
  if (!normalized) {
    return { products: [], total: 0, pagination: mapPagination(null) }
  }

  try {
    const requestParams = {
      page,
      limit,
      tags: normalized,
      ...params,
    }
    if (cacheBust) requestParams._cb = '1'

    const payload = await http.get(API_ENDPOINTS.products.all, {
      params: requestParams,
      signal,
    })

    const products = mapProductList(payload.products)
    const pagination = mapPagination(payload.pagination, products.length)

    return {
      products,
      total: pagination.total ?? products.length,
      pagination,
      raw: payload,
    }
  } catch {
    return {
      products: [],
      total: 0,
      pagination: mapPagination(null),
    }
  }
}

export async function getProducts(filters = {}) {
  const category = filters.category
  const searchQuery = String(filters.search || '').trim()
  const queryParams = buildProductQueryParams(filters)
  const tag =
    filters.tags ||
    filters.discountTag ||
    (category === 'sale' ? 'on-sale' : category === 'today-arrival' ? 'today-arrival' : null)

  // Prefer dedicated search API when a query is present
  if (searchQuery.length >= 2) {
    try {
      const { products, pagination, total } = await searchProducts(searchQuery, {
        page: filters.page || 1,
        limit: filters.limit || 12,
      })
      const filtered = applyProductFilters(products, { ...filters, search: undefined })
      return {
        products: filtered,
        total: filtered.length,
        pagination: {
          ...pagination,
          total: filtered.length === products.length ? total : filtered.length,
        },
      }
    } catch {
      // Fall back to catalog filter if search route is unavailable
    }
  }

  // When shop filters are active, hit /products/all with query params first
  if (hasServerFilterParams(queryParams) && !SPECIAL_CATEGORIES.has(category)) {
    try {
      const pageParams = {
        page: filters.page || 1,
        limit: filters.limit || PRODUCT_CATALOG_PAGE_SIZE,
        ...queryParams,
      }
      if (category && !SPECIAL_CATEGORIES.has(category)) {
        pageParams.category = category
      }
      if (filters.subcategory) {
        pageParams.subcategory = filters.subcategory
      }

      const { products, pagination } = await fetchProductsPage(pageParams)
      const filtered = applyProductFilters(products, {
        ...filters,
        // Keep category/subcategory client checks if API ignored them
        tags: undefined,
        onSale: undefined,
      })
      return {
        products: filtered,
        total: filtered.length === products.length ? pagination.total || products.length : filtered.length,
        pagination: {
          ...pagination,
          total: filtered.length === products.length ? pagination.total || products.length : filtered.length,
        },
      }
    } catch {
      // Fall through to category / catalog paths
    }
  }

  // Sale / tagged collections — server-side tags filter
  if (tag) {
    try {
      const { products, pagination, total } = await getProductsByTag(tag, {
        page: filters.page || 1,
        limit: filters.limit || 25,
        ...queryParams,
      })
      const filtered = applyProductFilters(products, {
        ...filters,
        category: undefined,
        tags: undefined,
        discountTag: undefined,
        onSale: undefined,
      })
      return {
        products: filtered,
        total: filtered.length === products.length ? total : filtered.length,
        pagination: {
          ...pagination,
          total: filtered.length === products.length ? total : filtered.length,
        },
      }
    } catch {
      // Fall back to catalog filter if tags route is unavailable
    }
  }

  // Prefer dedicated category API for real category slugs
  if (category && !SPECIAL_CATEGORIES.has(category)) {
    try {
      const { products, pagination, total } = await getProductsByCategory(category, {
        page: filters.page || 1,
        limit: filters.limit || 50,
        ...queryParams,
      })
      const filtered = applyProductFilters(products, { ...filters, category: undefined })
      return {
        products: filtered,
        total: filtered.length,
        pagination: {
          ...pagination,
          total: filtered.length === products.length ? total : filtered.length,
        },
      }
    } catch {
      // Fall back to full catalog if category route is unavailable
    }
  }

  const catalog = await getProductCatalog()
  const products = applyProductFilters(catalog.products, filters)

  return {
    products,
    total: products.length,
    pagination: catalog.pagination,
  }
}

/**
 * Fetch a single product by slug.
 * GET /api/products/:slug
 */
export async function getProductBySlug(slug, { signal } = {}) {
  const normalizedSlug = String(slug || '').trim()
  if (!normalizedSlug) {
    throw new ApiError({
      message: 'Product not found',
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
    })
  }

  const festProduct = getFestProductBySlug(normalizedSlug)

  try {
    const payload = await http.get(API_ENDPOINTS.products.bySlug(normalizedSlug), { signal })
    const product = extractProduct(payload)
    if (product) {
      if (festProduct) {
        return {
          ...festProduct,
          ...product,
          images: product.images?.length ? product.images : festProduct.images,
          image: product.images?.[0] || product.image || festProduct.image,
        }
      }
      return product
    }
  } catch (error) {
    if (error?.status === 404 || error?.code === 'PRODUCT_NOT_FOUND') {
      if (festProduct) return festProduct
      throw error instanceof ApiError
        ? error
        : new ApiError({
          message: 'Product not found',
          status: 404,
          code: 'PRODUCT_NOT_FOUND',
        })
    }
    // Fall through to catalog lookup for transient/network issues
  }

  if (festProduct) return festProduct

  const catalog = await getProductCatalog()
  const product = catalog.products.find((item) => item.slug === normalizedSlug)

  if (!product) {
    throw new ApiError({
      message: 'Product not found',
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
    })
  }

  return product
}

/**
 * Fetch a detailed product by id.
 * GET /api/products/detailed/:id
 */
export async function getProductDetailedById(id, { signal } = {}) {
  const normalizedId = String(id || '').trim()
  if (!normalizedId) {
    throw new ApiError({
      message: 'Product not found',
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
    })
  }

  const payload = await http.get(API_ENDPOINTS.products.detailedById(normalizedId), { signal })
  const product = extractProduct(payload)

  if (!product) {
    throw new ApiError({
      message: 'Product not found',
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
    })
  }

  return product
}

export async function getBestsellers() {
  const { products } = await getProductCatalog()
  return [...products].sort(
    (a, b) => b.soldCount - a.soldCount || b.reviewCount - a.reviewCount || Number(b.isFeatured) - Number(a.isFeatured)
  )
}

export async function getNewArrivals() {
  const { products } = await getProductCatalog()
  return [...products].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bTime - aTime
  })
}

export async function getBeautyProducts() {
  const { products } = await getProductCatalog()
  const beauty = products.filter((product) => BEAUTY_CATEGORIES.has(product.category))
  if (beauty.length) return beauty
  return products.filter((product) => product.isFeatured).slice(0, 8)
}

export async function getFeaturedProducts({ limit = 12, force = false } = {}) {
  const now = Date.now()
  const canUseCache =
    !force && featuredCache && featuredCacheLimit === limit && now - featuredCacheAt < FEATURED_TTL_MS

  if (canUseCache) return featuredCache

  if (!featuredInFlight) {
    featuredInFlight = http
      .get(API_ENDPOINTS.products.featured, { params: { page: 1, limit } })
      .then((payload) => {
        const products = mapProductList(payload.products)
        featuredCache = products
        featuredCacheAt = Date.now()
        featuredCacheLimit = limit
        return products
      })
      .finally(() => {
        featuredInFlight = null
      })
  }

  return featuredInFlight
}

export async function createOosInquiry({ productId, variantId, email, phone }) {
  return http.post(API_ENDPOINTS.oosInquiries.create, {
    productId: String(productId),
    variantId: String(variantId),
    email,
    phone,
  })
}

export { mapProduct } from './mappers'
