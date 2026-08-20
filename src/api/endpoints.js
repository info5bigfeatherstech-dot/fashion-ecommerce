/**
 * Central route catalog. Add new backend routes here so feature modules
 * never hardcode URLs. Unused groups are kept ready for upcoming APIs.
 */
export const API_ENDPOINTS = {
  products: {
    all: '/products/all',
    featured: '/products/featured',
    bySlug: (slug) => `/products/${encodeURIComponent(slug)}`,
    byId: (id) => `/products/id/${encodeURIComponent(id)}`,
    search: '/products/search',
  },
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  search: {
    query: '/search',
  },
}

export const PRODUCT_CATALOG_PAGE_SIZE = 50
export const PRODUCT_CATALOG_MAX_PAGES = 20
