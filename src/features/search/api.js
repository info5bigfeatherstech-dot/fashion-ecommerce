import { getProducts } from '@/features/product/api'

export async function searchProducts(query, { signal } = {}) {
  if (!query || query.length < 2) return []

  const { products } = await getProducts({ search: query }, { signal })
  return products.slice(0, 6)
}
