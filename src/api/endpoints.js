/**
 * Central route catalog. Add new backend routes here so feature modules
 * never hardcode URLs. Unused groups are kept ready for upcoming APIs.
 */
export const API_ENDPOINTS = {
  products: {
    all: '/products/all',
    featured: '/products/featured',
    bySlug: (slug) => `/products/${encodeURIComponent(slug)}`,
    detailedById: (id) => `/products/detailed/${encodeURIComponent(id)}`,
    byId: (id) => `/products/id/${encodeURIComponent(id)}`,
    byCategory: (slug) => `/products/category/${encodeURIComponent(slug)}`,
    related: (slug) => `/products/${encodeURIComponent(slug)}/related`,
    search: '/products/search',
  },
  auth: {
    securityQuestions: '/auth/security-questions',
    register: '/auth/register',
    otpVerifyLogin: '/auth/otp-verify-login',
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    refresh: '/auth/refresh',
    forgotFindUser: '/auth/forgot-password/find-user',
    forgotVerifyAnswers: '/auth/forgot-password/verify-answers',
    forgotVerifyOtpFallback: '/auth/forgot-password/verify-otp-fallback',
    forgotResetDirect: '/auth/forgot-password/reset-direct',
  },
  addresses: {
    list: '/addresses',
    create: '/addresses',
    byId: (id) => `/addresses/${encodeURIComponent(id)}`,
  },
  search: {
    query: '/search',
  },
}

export const PRODUCT_CATALOG_PAGE_SIZE = 50
export const PRODUCT_CATALOG_MAX_PAGES = 20
export const AUTH_PORTAL = 'ecomm'
export const STOREFRONT = 'ecomm'
