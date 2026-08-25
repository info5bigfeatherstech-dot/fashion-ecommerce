import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Suspense, useEffect, useMemo, useState } from 'react'
import {
  Archive,
  ArrowLeft,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  FileText,
  Globe,
  Heart,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Megaphone,
  Package,
  RotateCcw,
  Settings,
  Settings2,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Tag,
  Truck,
  User,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/PageLoader'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { SITE_NAME } from '@/config/site'
import { useAdminStore, ADMIN_ROLE_LABELS } from '@/features/admin/store'
import { useAdminLogout } from '@/features/admin/hooks'
import {
  getVisibleAdminNav,
  getVisibleSettingsNav,
  groupAdminNav,
  groupSettingsNav,
  SETTINGS_DEFAULT_PATH,
} from '@/features/admin/config/nav'

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  orders: Package,
  returns: RotateCcw,
  rto: Truck,
  products: Package,
  archived: Archive,
  analytics: BarChart3,
  outofstock: AlertTriangle,
  leads: Users,
  customers: Users,
  carts: ShoppingCart,
  wishlists: Heart,
  utilities: Wrench,
  website: Globe,
  'website-seo': BarChart3,
  'website-blogs': FileText,
  ecommerce: ShoppingBag,
  marketing: Megaphone,
  'marketing-hub': Megaphone,
  coupons: Tag,
  'free-shipping-offers': Megaphone,
  reviews: Star,
  'reviews-submissions': Star,
  'reviews-generated': Star,
  staff: UserCog,
  support: HelpCircle,
  settings: Settings,
  'settings-profile': User,
  'settings-controls': SlidersHorizontal,
  'settings-product-display': LayoutDashboard,
  'settings-delivery': Truck,
  'settings-label': ClipboardList,
  'settings-payment': Settings2,
  'settings-orders': ClipboardList,
  'settings-customer': Users,
  'settings-staff': UserCog,
  'settings-policies': FileText,
  'settings-help': HelpCircle,
  'settings-ideas': Lightbulb,
  'settings-other': Settings,
}

function isPathActive(pathname, path, { exact = false } = {}) {
  if (!path) return false
  if (exact || path === '/admin/dashboard') return pathname === path
  return pathname === path || pathname.startsWith(`${path}/`)
}

function parentHasActiveChild(pathname, children = []) {
  return children.some((child) => isPathActive(pathname, child.path, { exact: true })
    || isPathActive(pathname, child.path))
}

export function AdminShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const authReady = useAdminStore((s) => s.authReady)
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated)
  const user = useAdminStore((s) => s.user)
  const logout = useAdminLogout()

  const inSettings = location.pathname.startsWith('/admin/settings')
  const visibleNav = useMemo(() => getVisibleAdminNav(user?.role), [user?.role])
  const settingsNav = useMemo(() => getVisibleSettingsNav(user?.role), [user?.role])
  const navGroups = useMemo(() => groupAdminNav(visibleNav), [visibleNav])
  const settingsGroups = useMemo(() => groupSettingsNav(settingsNav), [settingsNav])

  const [expanded, setExpanded] = useState(() => new Set())

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev)
      for (const item of visibleNav) {
        if (item.children?.length && parentHasActiveChild(location.pathname, item.children)) {
          next.add(item.id)
        }
      }
      return next
    })
  }, [location.pathname, visibleNav])

  if (!authReady) {
    return (
      <div className="admin-shell admin-shell--loading">
        <p>Loading admin session…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
    } finally {
      navigate('/admin/login', { replace: true })
    }
  }

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderLink = (item, { nested = false } = {}) => {
    const Icon = NAV_ICONS[item.id] || Package
    const active = isPathActive(location.pathname, item.path, {
      exact: nested || item.path === '/admin/dashboard' || item.path === '/admin/marketing',
    })
    // Avoid parent "Leads" highlighting for every child path incorrectly when path is /admin/customers
    const parentActive = item.children?.length
      ? parentHasActiveChild(location.pathname, item.children)
      : active

    if (item.children?.length) {
      const open = expanded.has(item.id) || parentActive
      return (
        <div key={item.id} className="admin-sidebar__branch">
          <button
            type="button"
            className={`admin-sidebar__link${parentActive ? ' is-active' : ''}`}
            onClick={() => {
              toggleExpand(item.id)
              if (!parentActive) navigate(item.children[0]?.path || item.path)
            }}
            aria-expanded={open}
          >
            <Icon size={16} />
            <span>{item.label}</span>
            <span className={`admin-sidebar__chevron${open ? ' is-open' : ''}`} aria-hidden>
              ▾
            </span>
          </button>
          {open && (
            <div className="admin-sidebar__subnav">
              {item.children.map((child) => renderLink(child, { nested: true }))}
            </div>
          )}
        </div>
      )
    }

    return (
      <button
        key={item.id}
        type="button"
        className={`admin-sidebar__link${nested ? ' admin-sidebar__link--nested' : ''}${active || (!nested && parentActive) ? ' is-active' : ''}`}
        onClick={() => navigate(item.path)}
      >
        <Icon size={16} />
        <span>{item.label}</span>
      </button>
    )
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <Link to="/admin/dashboard" className="admin-sidebar__logo" aria-label={`${SITE_NAME} admin home`}>
            <BrandLogo />
          </Link>
          <h1 className="admin-sidebar__title">{inSettings ? 'Settings' : 'Super Admin '}</h1>
        </div>

        <nav
          className="admin-sidebar__nav"
          aria-label={inSettings ? 'Settings navigation' : 'Admin navigation'}
          data-lenis-prevent
        >
          {inSettings ? (
            <>
              <button
                type="button"
                className="admin-sidebar__link admin-sidebar__back"
                onClick={() => navigate('/admin/orders')}
              >
                <ArrowLeft size={16} />
                <span>Back to admin</span>
              </button>
              {Array.from(settingsGroups.entries()).map(([group, items]) => (
                <div key={group} className="admin-sidebar__group">
                  <p className="admin-sidebar__group-label">{group}</p>
                  {items.map((item) => renderLink(item))}
                </div>
              ))}
            </>
          ) : (
            Array.from(navGroups.entries()).map(([group, items]) => (
              <div key={group} className="admin-sidebar__group">
                <p className="admin-sidebar__group-label">{group}</p>
                {items.map((item) => {
                  if (item.id === 'settings') {
                    const Icon = NAV_ICONS.settings
                    const active = location.pathname.startsWith('/admin/settings')
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`admin-sidebar__link${active ? ' is-active' : ''}`}
                        onClick={() => navigate(SETTINGS_DEFAULT_PATH)}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </button>
                    )
                  }
                  return renderLink(item)
                })}
              </div>
            ))
          )}
        </nav>

        <div className="admin-sidebar__footer">
          <p className="admin-sidebar__user">{user?.name || user?.email}</p>
          <p className="admin-sidebar__role">
            {ADMIN_ROLE_LABELS[user?.role] || user?.role || 'Staff'}
          </p>
          <Button variant="ghost" size="sm" onClick={handleLogout} disabled={logout.isPending}>
            <LogOut size={14} />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="admin-main">
        <Suspense fallback={<PageLoader label="Loading admin page…" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
