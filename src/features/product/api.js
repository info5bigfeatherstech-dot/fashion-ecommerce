import { http } from '@/api/http'
import { API_ENDPOINTS, PRODUCT_CATALOG_MAX_PAGES, PRODUCT_CATALOG_PAGE_SIZE } from '@/api/endpoints'
import { ApiError } from '@/api/errors'
import { mapPagination, mapProductList } from './mappers'

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

export async function getProducts(filters = {}) {
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
