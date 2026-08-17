import { MOCK_PRODUCTS } from '@/features/product/api'

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

export async function searchProducts(query) {
  await delay()
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  return MOCK_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
  ).slice(0, 6)
}
