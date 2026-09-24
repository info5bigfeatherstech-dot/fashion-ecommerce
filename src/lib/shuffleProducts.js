/**
 * Storefront-only product list shuffling.
 * Stable within a browser tab session so React re-renders / remounts don't reshuffle.
 * Admin APIs must never use these helpers.
 */

const SESSION_SEED_KEY = 'fabuniqo_storefront_shuffle_seed'

function mulberry32(seed) {
  let t = seed >>> 0
  return function next() {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(input) {
  const str = String(input || '')
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** One seed per browser tab session (survives SPA navigations, not new tabs forever). */
export function getStorefrontShuffleSeed() {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return Date.now() >>> 0
    }
    let raw = sessionStorage.getItem(SESSION_SEED_KEY)
    if (!raw) {
      const entropy =
        (Date.now() >>> 0) ^
        ((Math.random() * 0xffffffff) >>> 0) ^
        ((performance?.now?.() || 0) * 1000 >>> 0)
      raw = String(entropy >>> 0)
      sessionStorage.setItem(SESSION_SEED_KEY, raw)
    }
    const n = Number(raw)
    return Number.isFinite(n) ? n >>> 0 : Date.now() >>> 0
  } catch {
    return Date.now() >>> 0
  }
}

/**
 * Fisher–Yates shuffle with seeded RNG. Returns a new array; never mutates input.
 */
export function seededShuffle(items, seed) {
  try {
    if (!Array.isArray(items) || items.length <= 1) {
      return Array.isArray(items) ? [...items] : []
    }
    const out = [...items]
    const rand = mulberry32((Number(seed) || 0) >>> 0)
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1))
      const tmp = out[i]
      out[i] = out[j]
      out[j] = tmp
    }
    return out
  } catch {
    return Array.isArray(items) ? [...items] : []
  }
}

/**
 * Shuffle then take the first `count` items (session-stable sample from a pool).
 */
export function shuffleTake(products, count, scope = 'default') {
  try {
    const n = Math.max(0, Math.floor(Number(count) || 0))
    const shuffled = shuffleProducts(products, scope)
    if (!n || shuffled.length <= n) return shuffled
    return shuffled.slice(0, n)
  } catch {
    const list = Array.isArray(products) ? [...products] : []
    const n = Math.max(0, Math.floor(Number(count) || 0))
    return n ? list.slice(0, n) : list
  }
}

/**
 * Shuffle products for a named storefront scope (category, tag, section, page…).
 * Same scope + same session → same order (stable UI).
 */
export function shuffleProducts(products, scope = 'default') {
  try {
    if (!Array.isArray(products) || products.length <= 1) {
      return Array.isArray(products) ? [...products] : []
    }
    const seed = (getStorefrontShuffleSeed() ^ hashString(scope)) >>> 0
    return seededShuffle(products, seed)
  } catch {
    return Array.isArray(products) ? [...products] : []
  }
}

/** Explicit PLP sorts / search relevance must keep deterministic order. */
export function shouldShuffleStorefrontList(filters = {}) {
  try {
    if (filters?.skipShuffle === true) return false
    const sort = String(filters?.sort || '').trim().toLowerCase()
    if (!sort || sort === 'featured' || sort === 'relevance') return true
    return false
  } catch {
    return true
  }
}

function productKey(product) {
  if (!product || typeof product !== 'object') return ''
  return String(product.id || product._id || product.slug || '')
}

/** Stable category key for diversity (slug preferred). */
export function productCategoryKey(product) {
  try {
    const raw =
      product?.category ||
      product?.categorySlug ||
      product?.categoryLabel ||
      product?.categoryName ||
      'uncategorized'
    const key = String(raw).trim().toLowerCase()
    return key || 'uncategorized'
  } catch {
    return 'uncategorized'
  }
}

/**
 * Session-shuffle then reorder so a sliding window of `windowSize` prefers unique categories.
 * Goal: viewport of ~4 cards rarely shows two items from the same category side-by-side.
 * Falls back gracefully when the catalog has fewer categories than the window.
 */
export function diversifyProductsByCategory(
  products,
  { windowSize = 4, limit = null, scope = 'diversify' } = {}
) {
  try {
    const pool = shuffleProducts(
      (Array.isArray(products) ? products : []).filter((p) => p && productKey(p)),
      scope
    )
    if (pool.length <= 1) {
      const n = limit != null ? Math.max(0, Math.floor(Number(limit) || 0)) : 0
      return n ? pool.slice(0, n) : pool
    }

    const win = Math.max(2, Math.floor(Number(windowSize) || 4))
    const max =
      limit != null
        ? Math.min(Math.max(0, Math.floor(Number(limit) || 0)), pool.length)
        : pool.length

    const remaining = [...pool]
    const out = []

    while (out.length < max && remaining.length) {
      const recent = out.slice(-(win - 1))
      const recentCats = new Set(recent.map(productCategoryKey))
      const lastCat = out.length ? productCategoryKey(out[out.length - 1]) : null

      let idx = remaining.findIndex((p) => !recentCats.has(productCategoryKey(p)))
      if (idx < 0 && lastCat) {
        idx = remaining.findIndex((p) => productCategoryKey(p) !== lastCat)
      }
      if (idx < 0) idx = 0

      out.push(remaining[idx])
      remaining.splice(idx, 1)
    }

    return out
  } catch {
    const list = Array.isArray(products) ? [...products] : []
    if (limit == null) return list
    const n = Math.max(0, Math.floor(Number(limit) || 0))
    return n ? list.slice(0, n) : list
  }
}

/**
 * Same featured pool for New Arrivals + Moving Fast, each with a different session-stable shuffle.
 * Order differs between sections; both stay scrollable carousels of the full featured set.
 */
export function splitFeaturedForHomeSections(products) {
  try {
    const list = (Array.isArray(products) ? products : []).filter(
      (p) => p && p.isFeatured !== false && productKey(p)
    )
    if (!list.length) {
      return { movingFast: [], newArrivals: [] }
    }

    let newArrivals = shuffleProducts(list, 'home-new-arrivals')
    let movingFast = shuffleProducts(list, 'home-moving-fast')

    // If RNG happened to produce the same order, rotate Moving Fast so UI feels different
    if (
      list.length > 1 &&
      newArrivals.length === movingFast.length &&
      newArrivals.every((p, i) => productKey(p) === productKey(movingFast[i]))
    ) {
      const mid = Math.floor(movingFast.length / 2) || 1
      movingFast = [...movingFast.slice(mid), ...movingFast.slice(0, mid)]
    }

    return { movingFast, newArrivals }
  } catch {
    const fallback = Array.isArray(products) ? [...products] : []
    return {
      movingFast: [...fallback].reverse(),
      newArrivals: fallback,
    }
  }
}
