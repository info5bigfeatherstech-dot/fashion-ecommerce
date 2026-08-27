export const reviewKeys = {
  all: ['product-reviews'],
  byProduct: (productId) => [...reviewKeys.all, 'product', String(productId || '')],
  mine: (productId) => [...reviewKeys.all, 'mine', String(productId || '')],
  eligibility: (productId) => [...reviewKeys.all, 'eligibility', String(productId || '')],
}
