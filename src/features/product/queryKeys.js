export const productKeys = {
  all: ['products'],
  lists: () => [...productKeys.all, 'list'],
  list: (filters) => [...productKeys.lists(), filters],
  details: () => [...productKeys.all, 'detail'],
  detail: (slug) => [...productKeys.details(), slug],
  bestsellers: () => [...productKeys.all, 'bestsellers'],
  newArrivals: () => [...productKeys.all, 'newArrivals'],
  beauty: () => [...productKeys.all, 'beauty'],
}
