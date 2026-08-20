import { searchProducts as searchProductsApi } from '@/features/product/api'

/**
 * Autosuggest / typeahead search.
 * Uses GET /api/products/search?q=...
 */
export async function searchProducts(query, { signal, limit = 6 } = {}) {
  if (!query || String(query).trim().length < 2) return []

  const { products } = await searchProductsApi(query, { signal, limit, page: 1 })
  return products.slice(0, limit)
}
