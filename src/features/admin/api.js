import { http } from '@/api/http'
import { API_ENDPOINTS, ADMIN_AUTH_PORTAL } from '@/api/endpoints'
import { useAdminStore, isAdminRole } from './store'

function mapAdminUser(user) {
  if (!user) return null
  return {
    id: user.id || user._id,
    name: user.name || '',
    email: user.email || '',
    role: user.role || '',
    phone: user.phone || '',
  }
}

function applyAdminSession(payload) {
  const user = mapAdminUser(payload?.user)
  if (!user || !isAdminRole(user.role)) {
    throw new Error('Access denied. Insufficient admin permissions.')
  }
  const accessToken = payload?.accessToken || null
  if (!accessToken) throw new Error('Login did not return an access token')
  useAdminStore.getState().setSession({ user, accessToken })
  return { user, accessToken }
}

let adminRefreshPromise = null

export async function refreshAdminSession() {
  if (!adminRefreshPromise) {
    adminRefreshPromise = http
      .post(
        API_ENDPOINTS.auth.refresh,
        { portal: ADMIN_AUTH_PORTAL },
        { skipAuthRefresh: true, useAdminAuth: true }
      )
      .then(async (payload) => {
        const accessToken = payload?.accessToken
        if (!accessToken) throw new Error('Admin refresh did not return an access token')

        useAdminStore.getState().setAccessToken(accessToken)

        let user = mapAdminUser(payload?.user)
        if (!user) {
          user = await fetchAdminMe()
        }

        useAdminStore.getState().setSession({ user, accessToken })
        return { user, accessToken }
      })
      .finally(() => {
        adminRefreshPromise = null
      })
  }
  return adminRefreshPromise
}

export async function fetchAdminMe() {
  const payload = await http.get(API_ENDPOINTS.auth.me, {
    skipAuthRefresh: true,
    useAdminAuth: true,
  })
  const user = mapAdminUser(payload?.user)
  if (!user || !isAdminRole(user.role)) {
    throw new Error('Insufficient admin role')
  }
  return user
}

export async function adminLogin({ identifier, email, password }) {
  const payload = await http.post(API_ENDPOINTS.auth.login, {
    identifier: identifier || email,
    password,
    portal: ADMIN_AUTH_PORTAL,
  }, { skipAuthRefresh: true })

  return {
    message: payload?.message || 'Login successful',
    ...applyAdminSession(payload),
  }
}

export async function adminLogout() {
  try {
    await http.post(API_ENDPOINTS.auth.logout, null, {
      skipAuthRefresh: true,
      useAdminAuth: true,
    })
  } catch {
    /* clear local session regardless */
  } finally {
    useAdminStore.getState().clearSession()
  }
}

// Re-export domain APIs (orders, products, analytics, marketing, settings)
export {
  getAdminOrdersSummary,
  getAdminOrdersList,
  getAdminOrderDetail,
  getAdminOrderTracking,
  bulkConfirmOrders,
  bulkCancelOrders,
  bulkShipNowOrders,
  bulkSchedulePickupOrders,
  bulkSyncShiprocketOrders,
  downloadBulkTaxInvoicesZip,
  downloadBulkShippingLabelsZip,
  downloadBulkManifestsZip,
  autoSyncOrderStatuses,
  getAdminReturnRequests,
  getAdminReturnDetail,
  decideAdminReturnRequest,
  initiateAdminReturnRefund,
  retryAdminReturnReversePickup,
  getAdminRtoOrders,
  getAdminRtoAnalytics,
  isPostConfirmOrderStatus,
  ensureAdminOrderShipment,
  assignAdminOrderShip,
  scheduleAdminOrderPickup,
  syncAdminOrderShiprocket,
  generateAdminOrderManifest,
  generateAdminOrderShippingLabel,
  cancelAdminOrderShipment,
  retryAdminOrderPickup,
  getAdminAddressIntelligence,
  previewAdminPendingAddressEdit,
  applyAdminPendingAddressEdit,
  previewAdminPendingOrderEdit,
  applyAdminPendingOrderEdit,
  getAdminPickupCalendar,
  fetchAdminOrderInvoiceHtml,
  downloadAdminOrderShippingLabelFile,
  downloadAdminOrderManifestFile,
} from './api/orders'

export {
  getAdminProductsAll,
  getAdminProductsActiveCount,
  getAdminProductsLowStock,
  getAdminProductsArchived,
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  hardDeleteAdminCategory,
  reorderAdminCategories,
  toggleAdminCategoryVisibility,
  getCategoryImageUrl,
  normalizeAdminCategoriesPayload,
  sortAdminCategories,
  exportAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  archiveAdminProduct,
  restoreAdminProduct,
  hardDeleteAdminProduct,
  toggleAdminProductFeatured,
  bulkUpdateAdminProductStatus,
  bulkUpdateAdminProductFlags,
  syncAdminProductMarketingTags,
} from './api/products'

export {
  getAdminUsers,
  getAdminUserDetail,
  exportAdminUsers,
  sendBulkCartReminderEmail,
  sendBulkCartReminderPush,
  getAdminLeadsPushSettings,
  updateAdminLeadsPushSettings,
  getAdminCarts,
  getAdminCartById,
  getAdminAbandonedCarts,
  getAdminHighValueCarts,
  getAdminWishlists,
  getAdminStaleWishlists,
  getAdminPopularWishlistProducts,
  getAdminDashboardSummary,
} from './api/analytics'

export {
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
  toggleAdminCoupon,
  getAdminStaff,
  getAdminStaffProfile,
  createAdminStaff,
  updateAdminStaff,
  deleteAdminStaff,
  initiateAdminStaffPasswordReset,
  verifyAdminStaffPasswordReset,
  getAdminOosInquiries,
  updateAdminOosInquiryStatus,
} from './api/marketing'

export {
  getAdminFreeShippingOffers,
  getAdminFreeShippingOffer,
  createAdminFreeShippingOffer,
  updateAdminFreeShippingOffer,
  deleteAdminFreeShippingOffer,
  toggleAdminFreeShippingOffer,
} from './api/freeShippingOffers'

export {
  getAdminCheckoutSettings,
  updateAdminCheckoutSettings,
  getAdminShippingSettings,
  updateAdminShippingSettings,
  testAdminShippingConnection,
  getAdminShipmozoWarehouses,
  getAdminShipmozoLabelSettings,
  updateAdminShipmozoLabelSettings,
  previewAdminShipmozoLabelSettings,
  uploadAdminShipmozoLabelLogo,
  deleteAdminShipmozoLabelLogo,
} from './api/settings'
