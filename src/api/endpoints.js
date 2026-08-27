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
    byId: (orderId) => `/orders/items/${encodeURIComponent(String(orderId))}`,
    track: (orderId) => `/orders/items/${encodeURIComponent(String(orderId))}/track`,
    verifyPayment: '/orders/items/verify-payment',
    initiatePayment: (orderId) =>
      `/orders/items/${encodeURIComponent(String(orderId))}/initiate-payment`,
    abandonOnlineCheckout: (orderId) =>
      `/orders/items/${encodeURIComponent(String(orderId))}/abandon-online-checkout`,
  },
  admin: {
    ordersSummary: '/admin/orders/summary',
    orders: '/admin/orders',
    ordersAutoSync: '/admin/orders/auto-sync-statuses',
    bulkConfirm: '/orders/admin/items/bulk-approval/confirm',
    bulkCancel: '/orders/admin/items/bulk-approval/cancel',
    bulkShipNow: '/orders/admin/items/bulk-fulfillment/ship-now',
    bulkSchedulePickup: '/orders/admin/items/bulk-fulfillment/schedule-pickup',
    bulkSyncShiprocket: '/orders/admin/items/bulk-fulfillment/sync-shiprocket',
    bulkTaxInvoicesZip: '/orders/admin/items/bulk-documents/tax-invoices-zip',
    bulkShippingLabelsZip: '/orders/admin/items/bulk-documents/shipping-labels-zip',
    bulkManifestsZip: '/orders/admin/items/bulk-documents/manifests-zip',
    orderInvoiceHtml: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/invoice-html`,
    orderAddressIntelligence: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/address-intelligence`,
    orderEditPendingAddressPreview: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/edit-pending-address/preview`,
    orderEditPendingAddress: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/edit-pending-address`,
    orderEditPendingItemsPreview: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/edit-pending/preview`,
    orderEditPendingItems: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/edit-pending`,
    orderEnsureShipment: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/fulfillment/ensure-shipment`,
    orderAssignShip: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/fulfillment/assign-ship`,
    orderSchedulePickup: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/fulfillment/schedule-pickup`,
    orderSyncShiprocket: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/fulfillment/sync-shiprocket`,
    orderManifest: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/fulfillment/manifest`,
    orderShippingLabel: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/fulfillment/shipping-label`,
    orderCancelShipment: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/fulfillment/cancel-shipment`,
    orderRetryPickup: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/fulfillment/retry-pickup`,
    orderShippingLabelFile: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/fulfillment/shipping-label-file`,
    orderManifestFile: (orderId) =>
      `/orders/admin/items/${encodeURIComponent(String(orderId))}/fulfillment/manifest-file`,
    pickupCalendar: '/orders/admin/fulfillment/pickup-calendar',
    productsAll: '/admin/products/all',
    productsCreate: '/admin/products',
    productsExport: '/admin/products/export-csv',
    productsBulkStatus: '/admin/products/bulk-status',
    productsUpdateFlags: '/admin/products/updateFlags',
    productsBulkTemplate: '/admin/products/bulk-upload-template',
    productsPreviewCsv: '/admin/products/preview-csv',
    productsImportCsv: '/admin/products/import-csv',
    productsBulkNew: '/admin/products/bulk-new-products',
    productsActive: '/admin/products/active',
    productsLowStock: '/admin/products/low-stock',
    productsArchived: '/admin/products/archived',
    productBySlug: (slug) => `/admin/products/${encodeURIComponent(slug)}`,
    productVariants: (slug) => `/admin/products/${encodeURIComponent(slug)}/variants`,
    productRestore: (slug) => `/admin/products/restore/${encodeURIComponent(slug)}`,
    productHardDelete: (slug) => `/admin/products/hard/${encodeURIComponent(slug)}`,
    users: '/admin/analytics/users',
    userById: (userId) => `/admin/analytics/users/${encodeURIComponent(String(userId))}`,
    usersExport: '/admin/analytics/users/export',
    usersBulkCartReminderEmail: '/admin/analytics/users/bulk-cart-reminder-email',
    usersBulkCartReminderPush: '/admin/analytics/users/bulk-cart-reminder-push',
    leadsPushSettings: '/admin/analytics/push-settings',
    productReviews: '/admin/product-reviews',
    productReviewsGenerated: '/admin/product-reviews/generated',
    productReviewGeneratedById: (id) =>
      `/admin/product-reviews/generated/${encodeURIComponent(String(id))}`,
    productReviewStatus: (id) =>
      `/admin/product-reviews/${encodeURIComponent(String(id))}/status`,
    productByVariantCode: (code) =>
      `/admin/products/variant/${encodeURIComponent(String(code))}`,
    seoOverview: '/admin/seo-analytics/overview',
    categories: '/categories/admin/categories',
    rtoReport: '/admin/rto/report',
    carts: '/admin/analytics/carts',
    cartsAbandoned: '/admin/analytics/carts/abandoned',
    cartsHighValue: '/admin/analytics/carts/high-value',
    cartById: (cartId) => `/admin/analytics/carts/${encodeURIComponent(String(cartId))}`,
    wishlists: '/admin/analytics/wishlists',
    wishlistsStale: '/admin/analytics/wishlists/stale',
    wishlistsPopular: '/admin/analytics/wishlists/popular-products',
    dashboardSummary: '/admin/analytics/dashboard/summary',
    coupons: '/admin/coupons',
    couponById: (id) => `/admin/coupons/${encodeURIComponent(String(id))}`,
    couponToggle: (id) => `/admin/coupons/${encodeURIComponent(String(id))}/toggle`,
    freeShippingOffers: '/admin/free-shipping-offers',
    freeShippingOfferById: (id) => `/admin/free-shipping-offers/${encodeURIComponent(String(id))}`,
    freeShippingOfferToggle: (id) => `/admin/free-shipping-offers/${encodeURIComponent(String(id))}/toggle`,
    staff: '/admin/staff',
    staffProfile: '/admin/staff/profile/me',
    staffProfilePasswordResetInit: '/admin/staff/profile/me/initiate-password-reset',
    staffProfilePasswordResetVerify: '/admin/staff/profile/me/verify-password-reset',
    staffById: (id) => `/admin/staff/${encodeURIComponent(String(id))}`,
    staffInitiateReset: (id) => `/admin/staff/${encodeURIComponent(String(id))}/initiate-reset`,
    staffVerifyReset: (id) => `/admin/staff/${encodeURIComponent(String(id))}/verify-reset`,
    returns: '/orders/admin/returns/requests',
    returnDetail: (orderId) =>
      `/orders/admin/returns/requests/${encodeURIComponent(String(orderId))}`,
    returnDecision: (orderId) =>
      `/orders/admin/returns/requests/${encodeURIComponent(String(orderId))}/decision`,
    returnRefund: (orderId) =>
      `/orders/admin/returns/requests/${encodeURIComponent(String(orderId))}/refund`,
    returnReversePickupRetry: (orderId) =>
      `/orders/admin/returns/requests/${encodeURIComponent(String(orderId))}/reverse-pickup/retry`,
    rtoOrders: '/admin/rto/orders',
    rtoAnalytics: '/admin/rto/analytics',
    oosInquiries: '/admin/oos-inquiries',
    oosInquiryStatus: (id) => `/admin/oos-inquiries/${encodeURIComponent(String(id))}/status`,
    shippingSettings: '/shipping-provider/admin/settings',
    shippingTest: '/shipping-provider/admin/shipmozo/test',
    shippingWarehouses: '/shipping-provider/admin/shipmozo/warehouses',
    shipmozoLabelSettings: '/shipping-provider/admin/shipmozo-label-settings',
    shipmozoLabelSettingsPreview: '/shipping-provider/admin/shipmozo-label-settings/preview',
    shipmozoLabelSettingsLogo: '/shipping-provider/admin/shipmozo-label-settings/logo',
  },
  delivery: {
    check: '/delivery/check-delivery',
    charges: (pincode) => `/delivery/delivery-charges/${encodeURIComponent(pincode)}`,
  },
  coupons: {
    available: '/coupons/available',
    validate: '/coupons/validate',
  },
  oosInquiries: {
    create: '/oos-inquiries',
  },
  search: {
    query: '/search',
  },
  categories: {
    list: '/categories/categories',
    byId: (id) => `/categories/categories/${encodeURIComponent(String(id))}`,
  },
  productReviews: {
    summary: (productId) =>
      `/product-reviews/public/${encodeURIComponent(String(productId))}/summary`,
    list: (productId) =>
      `/product-reviews/public/${encodeURIComponent(String(productId))}`,
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
