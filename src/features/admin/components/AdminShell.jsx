import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Archive,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Package,
  RotateCcw,
  Settings,
  ShoppingCart,
  Tag,
  Truck,
  Users,
  UserCog,
  Heart,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SITE_NAME } from '@/config/site'
import { useAdminStore, ADMIN_ROLE_LABELS } from '@/features/admin/store'
import { useAdminLogout } from '@/features/admin/hooks'
import { getVisibleAdminNav, groupAdminNav } from '@/features/admin/config/nav'

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  orders: Package,
  returns: RotateCcw,
  rto: Truck,
  products: Package,
  archived: Archive,
  analytics: BarChart3,
  outofstock: AlertTriangle,
  customers: Users,
  carts: ShoppingCart,
  wishlists: Heart,
  coupons: Tag,
  staff: UserCog,
  'settings-payment': Settings,
  'settings-delivery': Truck,
}

export function AdminShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const authReady = useAdminStore((s) => s.authReady)
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated)
  const user = useAdminStore((s) => s.user)
  const logout = useAdminLogout()

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

  const visibleNav = getVisibleAdminNav(user?.role)
  const navGroups = groupAdminNav(visibleNav)

  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
    } finally {
      navigate('/admin/login', { replace: true })
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <p className="heading-sm text-accent">{SITE_NAME}</p>
          <h1 className="admin-sidebar__title">Admin</h1>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Admin navigation">
          {Array.from(navGroups.entries()).map(([group, items]) => (
            <div key={group} className="admin-sidebar__group">
              <p className="admin-sidebar__group-label">{group}</p>
              {items.map((item) => {
                const Icon = NAV_ICONS[item.id] || Package
                const active = location.pathname === item.path
                  || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path))
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`admin-sidebar__link${active ? ' is-active' : ''}`}
                    onClick={() => navigate(item.path)}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
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
        <Outlet />
      </main>
    </div>
  )
}
