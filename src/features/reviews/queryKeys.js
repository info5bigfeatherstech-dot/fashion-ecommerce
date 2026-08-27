export const reviewKeys = {
  all: ['product-reviews'],
  byProduct: (productId) => [...reviewKeys.all, String(productId || '')],
}
