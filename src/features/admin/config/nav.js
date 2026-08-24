/**
 * fabFE-aligned admin navigation.
 * Main tabs mirror TabRegistry.js; settings items mirror SettingTabregistry.js.
 */

export const SETTINGS_NAV_ITEMS = [
  { id: 'settings-profile', label: 'Profile', path: '/admin/settings/profile', group: 'Store' },
  { id: 'settings-controls', label: 'Controls', path: '/admin/settings/controls', group: 'Store' },
  { id: 'settings-product-display', label: 'Product display', path: '/admin/settings/product-display', group: 'Website' },
  { id: 'settings-delivery', label: 'Delivery', path: '/admin/settings/delivery', group: 'E-Commerce' },
  { id: 'settings-label', label: 'Label settings', path: '/admin/settings/label', group: 'E-Commerce' },
  { id: 'settings-payment', label: 'Payments', path: '/admin/settings/payment', group: 'E-Commerce' },
  { id: 'settings-orders', label: 'Orders', path: '/admin/settings/orders', group: 'E-Commerce' },
  { id: 'settings-customer', label: 'Customer', path: '/admin/settings/customer', group: 'General' },
  { id: 'settings-staff', label: 'Staff', path: '/admin/settings/staff', group: 'General' },
  { id: 'settings-policies', label: 'Store policies', path: '/admin/settings/policies', group: 'General' },
  { id: 'settings-help', label: 'Help center', path: '/admin/settings/help', group: 'Help & Support' },
  { id: 'settings-ideas', label: 'Suggest ideas', path: '/admin/settings/ideas', group: 'Help & Support' },
  { id: 'settings-other', label: 'Other', path: '/admin/settings/other', group: 'Help & Support' },
]

export const ADMIN_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', group: 'Overview' },
  { id: 'orders', label: 'Orders', path: '/admin/orders', group: 'Operations' },
  { id: 'returns', label: 'Returns & Refunds', path: '/admin/returns', group: 'Operations' },
  { id: 'rto', label: 'RTO', path: '/admin/rto', group: 'Operations' },
  { id: 'products', label: 'Products', path: '/admin/products', group: 'Catalog' },
  { id: 'analytics', label: 'Store Analytics', path: '/admin/analytics', group: 'Catalog' },
  { id: 'archived', label: 'Archived', path: '/admin/archived', group: 'Catalog' },
  { id: 'outofstock', label: 'Out of Stock Query', path: '/admin/out-of-stock', group: 'Catalog' },
  { id: 'leads', label: 'Leads', path: '/admin/leads', group: 'Growth' },
  {
    id: 'customers-parent',
    label: 'Customers',
    path: '/admin/customers',
    group: 'Growth',
    children: [
      { id: 'customers', label: 'Customers', path: '/admin/customers' },
      { id: 'carts', label: 'Carts', path: '/admin/carts' },
      { id: 'wishlists', label: 'Wishlists', path: '/admin/wishlists' },
    ],
  },
  { id: 'utilities', label: 'Utilities', path: '/admin/utilities', group: 'Growth' },
  {
    id: 'website',
    label: 'Website',
    path: '/admin/website/seo',
    group: 'Growth',
    children: [
      { id: 'website-seo', label: 'SEO Analysis', path: '/admin/website/seo' },
      { id: 'website-blogs', label: 'Blogs', path: '/admin/website/blogs' },
    ],
  },
  { id: 'ecommerce', label: 'E-Commerce', path: '/admin/ecommerce', group: 'Growth' },
  {
    id: 'marketing',
    label: 'Marketing',
    path: '/admin/marketing',
    group: 'Growth',
    children: [
      { id: 'marketing-hub', label: 'Overview', path: '/admin/marketing' },
      { id: 'coupons', label: 'Coupons', path: '/admin/coupons' },
    ],
  },
  {
    id: 'reviews',
    label: 'Reviews',
    path: '/admin/reviews/submissions',
    group: 'Growth',
    children: [
      { id: 'reviews-submissions', label: 'Customer submissions', path: '/admin/reviews/submissions' },
      { id: 'reviews-generated', label: 'Generated reviews', path: '/admin/reviews/generated' },
    ],
  },
  { id: 'staff', label: 'Staff', path: '/admin/staff', group: 'Team' },
  { id: 'support', label: 'Support', path: '/admin/support', group: 'Team' },
  {
    id: 'settings',
    label: 'Settings',
    path: '/admin/settings/profile',
    group: 'Team',
  },
]

/** Tab ids each role may access — mirrors fabFE roles.js (+ dashboard for this app). */
export const ADMIN_TAB_PERMISSIONS = {
  admin: [
    'dashboard',
    'orders',
    'returns',
    'rto',
    'products',
    'analytics',
    'archived',
    'outofstock',
    'leads',
    'customers',
    'carts',
    'wishlists',
    'utilities',
    'website',
    'website-seo',
    'website-blogs',
    'ecommerce',
    'marketing',
    'marketing-hub',
    'coupons',
    'reviews',
    'reviews-submissions',
    'reviews-generated',
    'staff',
    'support',
    'settings',
    ...SETTINGS_NAV_ITEMS.map((item) => item.id),
  ],
  product_manager: ['dashboard', 'products', 'archived', 'analytics', 'outofstock'],
  order_manager: [
    'dashboard',
    'orders',
    'returns',
    'rto',
    'settings',
    'settings-payment',
    'settings-delivery',
    'settings-orders',
    'settings-label',
  ],
  marketing_manager: [
    'dashboard',
    'analytics',
    'marketing',
    'marketing-hub',
    'coupons',
    'leads',
    'customers',
    'carts',
    'wishlists',
  ],
}

export function getAllowedAdminTabs(role) {
  const key = String(role || '').toLowerCase()
  return ADMIN_TAB_PERMISSIONS[key] || []
}

function isAllowed(allowed, id) {
  return allowed.has(id)
}

export function getVisibleAdminNav(role) {
  const allowed = new Set(getAllowedAdminTabs(role))
  return ADMIN_NAV_ITEMS
    .filter((item) => isAllowed(allowed, item.id))
    .map((item) => {
      if (!item.children?.length) return item
      const children = item.children.filter((child) => isAllowed(allowed, child.id))
      return { ...item, children }
    })
}

export function getVisibleSettingsNav(role) {
  const allowed = new Set(getAllowedAdminTabs(role))
  const key = String(role || '').toLowerCase()
  if (key === 'admin' || allowed.has('settings')) {
    return SETTINGS_NAV_ITEMS
  }
  return SETTINGS_NAV_ITEMS.filter((item) => allowed.has(item.id))
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

export function groupSettingsNav(items = SETTINGS_NAV_ITEMS) {
  return groupAdminNav(items)
}

export const SETTINGS_DEFAULT_PATH = '/admin/settings/profile'
