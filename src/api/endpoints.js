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
    google: '/auth/google',
  },
  addresses: {
    list: '/addresses',
    create: '/addresses',
    byId: (id) => `/addresses/${encodeURIComponent(id)}`,
  },
  cart: {
    root: '/cart',
    item: '/cart/item',
    bulkRemove: '/cart/bulk-remove',
    clear: '/cart/clear',
    merge: '/cart/merge',
  },
  wishlist: {
    root: '/wishlist',
    add: '/wishlist/add',
    removeBySlug: (slug) => `/wishlist/remove/${encodeURIComponent(slug)}`,
    removeBulk: '/wishlist/remove-bulk',
    clear: '/wishlist/clear',
    merge: '/wishlist/merge',
    moveToCart: '/wishlist/move-to-cart',
  },
  checkout: {
    settings: '/checkout/settings',
    adminSettings: '/checkout/admin/settings',
    quote: '/checkout/quote',
    confirm: '/checkout/confirm',
  },
  public: {
    razorpayKey: '/public/razorpay-key',
  },
  orders: {
    items: '/orders/items',
    verifyPayment: '/orders/items/verify-payment',
    abandonOnlineCheckout: (orderId) =>
      `/orders/items/${encodeURIComponent(String(orderId))}/abandon-online-checkout`,
  },
  admin: {
    ordersSummary: '/admin/orders/summary',
    ordersList: '/admin/orders/list',
    orderDetail: (orderId) => `/admin/orders/${encodeURIComponent(String(orderId))}`,
  },
  delivery: {
    check: '/delivery/check-delivery',
    charges: (pincode) => `/delivery/delivery-charges/${encodeURIComponent(pincode)}`,
  },
  coupons: {
    available: '/coupons/available',
    validate: '/coupons/validate',
  },
  search: {
    query: '/search',
  },
}

export const PRODUCT_CATALOG_PAGE_SIZE = 50
export const PRODUCT_CATALOG_MAX_PAGES = 20
export const AUTH_PORTAL = 'ecomm'
export const ADMIN_AUTH_PORTAL = 'admin-ecomm'
export const STOREFRONT = 'ecomm'

export const ADMIN_ROLES = [
  'admin',
  'product_manager',
  'order_manager',
  'marketing_manager',
]
