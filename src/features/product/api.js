import { http } from '@/api/http'
import { API_ENDPOINTS, PRODUCT_CATALOG_MAX_PAGES, PRODUCT_CATALOG_PAGE_SIZE } from '@/api/endpoints'
import { ApiError } from '@/api/errors'
import { extractProductList, mapPagination, mapProductList } from './mappers'

export {
  PRICE_RANGES,
  BADGE_OPTIONS,
  SIZE_OPTIONS,
  COLOR_OPTIONS,
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

function applyProductFilters(products, filters = {}) {
  let results = products

  if (filters.category === 'beauty') {
    results = results.filter((product) => BEAUTY_CATEGORIES.has(product.category))
  } else if (filters.category === 'sale') {
    results = results.filter((product) => product.originalPrice)
  } else if (filters.category === 'new-arrivals') {
    results = results.filter((product) => product.badge === 'new' || product.badge === 'limited')
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
    results = results.filter((product) => product.colors.includes(filters.color))
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

  const payload = await http.get(API_ENDPOINTS.products.byCategory(slug), {
    params: { page, limit, ...params },
    signal,
  })

  const products = extractProductList(payload)
  const pagination = mapPagination(payload?.pagination ?? payload?.data?.pagination, products.length)

  return {
    products,
    total: pagination.total || products.length,
    pagination,
    raw: payload,
  }
}

/**
 * Related products for a product slug (shown on PDP).
 * GET /api/products/:slug/related
 */
export async function getRelatedProducts(slug, { signal, limit } = {}) {
  if (!slug) return []

  const payload = await http.get(API_ENDPOINTS.products.related(slug), {
    params: limit ? { limit } : undefined,
    signal,
  })

  return extractProductList(payload)
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

export async function getProducts(filters = {}) {
  const category = filters.category
  const searchQuery = String(filters.search || '').trim()

  // Prefer dedicated search API when a query is present
  if (searchQuery.length >= 2) {
    try {
      const { products, pagination, total } = await searchProducts(searchQuery)
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

  // Prefer dedicated category API for real category slugs
  if (category && !SPECIAL_CATEGORIES.has(category)) {
    try {
      const { products, pagination, total } = await getProductsByCategory(category)
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

export async function getProductBySlug(slug) {
  const catalog = await getProductCatalog()
  const product = catalog.products.find((item) => item.slug === slug)

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

export { mapProduct } from './mappers'
