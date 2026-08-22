import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Package, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SITE_NAME } from '@/config/site'
import { useAdminStore, getAllowedAdminTabs, ADMIN_ROLE_LABELS } from '@/features/admin/store'
import { useAdminLogout } from '@/features/admin/hooks'

const NAV_ITEMS = [
  { id: 'orders', label: 'Orders', icon: Package, path: '/admin/orders' },
  { id: 'settings-payment', label: 'Payment settings', icon: Settings, path: '/admin/settings/payment' },
]

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

  const allowedTabs = getAllowedAdminTabs(user?.role)
  const visibleNav = NAV_ITEMS.filter((item) => allowedTabs.includes(item.id))

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
          {visibleNav.map((item) => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.path)
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
