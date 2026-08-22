/** fabFE-aligned admin navigation + role permissions. */
export const ADMIN_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', group: 'Overview' },
  { id: 'orders', label: 'Orders', path: '/admin/orders', group: 'Operations' },
  { id: 'returns', label: 'Returns', path: '/admin/returns', group: 'Operations' },
  { id: 'rto', label: 'RTO', path: '/admin/rto', group: 'Operations' },
  { id: 'products', label: 'Products', path: '/admin/products', group: 'Catalog' },
  { id: 'archived', label: 'Archived', path: '/admin/archived', group: 'Catalog' },
  { id: 'analytics', label: 'Analytics', path: '/admin/analytics', group: 'Catalog' },
  { id: 'outofstock', label: 'Out of stock', path: '/admin/out-of-stock', group: 'Catalog' },
  { id: 'customers', label: 'Customers', path: '/admin/customers', group: 'Leads' },
  { id: 'carts', label: 'Carts', path: '/admin/carts', group: 'Leads' },
  { id: 'wishlists', label: 'Wishlists', path: '/admin/wishlists', group: 'Leads' },
  { id: 'coupons', label: 'Coupons', path: '/admin/coupons', group: 'Marketing' },
  { id: 'staff', label: 'Staff', path: '/admin/staff', group: 'Team' },
  { id: 'settings-payment', label: 'Payments', path: '/admin/settings/payment', group: 'Settings' },
  { id: 'settings-delivery', label: 'Delivery', path: '/admin/settings/delivery', group: 'Settings' },
]

/** Tab ids each role may access — mirrors fabFE roles.js. */
export const ADMIN_TAB_PERMISSIONS = {
  admin: ADMIN_NAV_ITEMS.map((item) => item.id),
  product_manager: ['products', 'archived', 'analytics', 'outofstock'],
  order_manager: ['orders', 'returns', 'rto', 'settings-payment', 'settings-delivery'],
  marketing_manager: ['analytics', 'coupons', 'customers', 'carts', 'wishlists'],
}

export function getAllowedAdminTabs(role) {
  const key = String(role || '').toLowerCase()
  return ADMIN_TAB_PERMISSIONS[key] || []
}

export function getVisibleAdminNav(role) {
  const allowed = new Set(getAllowedAdminTabs(role))
  return ADMIN_NAV_ITEMS.filter((item) => allowed.has(item.id))
}

export function groupAdminNav(items) {
  const groups = new Map()
  for (const item of items) {
    const g = item.group || 'Other'
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g).push(item)
  }
  return groups
}
