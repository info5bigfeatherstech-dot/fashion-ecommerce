import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Heart, MapPin, Package, ShoppingBag, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Input, InputGroup } from '@/components/ui/Input'
import { Separator } from '@/components/ui/Separator'
import { logout } from '@/features/auth/api'
import { useAppStore } from '@/store'
import { useCartCount, useWishlistCount } from '@/store/selectors'
import { AccountAddressesTab } from '@/routes/account/AccountAddressesTab'
import { AccountCartTab } from '@/routes/account/AccountCartTab'
import { AccountOrdersTab } from '@/routes/account/AccountOrdersTab'
import { AccountWishlistTab } from '@/routes/account/AccountWishlistTab'

const ACCOUNT_QUICK_LINKS = [
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: 'wishlist' },
  { id: 'cart', label: 'Cart', icon: ShoppingBag, badge: 'cart' },
]

const ACCOUNT_MENU_LINKS = [
  { id: 'profile', label: 'Profile information', icon: UserRound },
  { id: 'addresses', label: 'Saved addresses', icon: MapPin },
]

export default function Account({ initialActiveTab = 'orders' } = {}) {
  const user = useAppStore((s) => s.user)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const openAuthModal = useAppStore((s) => s.openAuthModal)
  const clearUser = useAppStore((s) => s.clearUser)
  const cartCount = useCartCount()
  const wishlistCount = useWishlistCount()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(initialActiveTab)

  const badgeCounts = { cart: cartCount, wishlist: wishlistCount }

  const handleLogout = async () => {
    await logout()
    clearUser()
  }

  useEffect(() => {
    setActiveTab(initialActiveTab)
  }, [initialActiveTab])

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal({ redirectTo: '/account', mode: 'login' })
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate, openAuthModal])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container account-layout">
      <aside className="account-sidebar">
        <div className="account-sidebar__card">
          <div className="account-sidebar__avatar">
            <UserRound size={22} />
          </div>
          <div className="account-sidebar__identity">
            <p className="account-sidebar__hello">Hello,</p>
            <p className="account-sidebar__name">{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}</p>
            <p className="account-sidebar__email">{user.email}</p>
          </div>
        </div>

        <div className="account-quick">
          {ACCOUNT_QUICK_LINKS.map((link) => {
            const Icon = link.icon
            const count = link.badge ? badgeCounts[link.badge] : 0

            return (
              <button
                key={link.id}
                type="button"
                className={`account-quick__tile ${activeTab === link.id ? 'account-quick__tile--active' : ''}`}
                onClick={() => setActiveTab(link.id)}
              >
                <Icon size={18} />
                <span>{link.label}</span>
                {count > 0 && <b>{count}</b>}
              </button>
            )
          })}
        </div>

        <nav className="account-menu" aria-label="Account settings">
          {ACCOUNT_MENU_LINKS.map((link) => {
            const Icon = link.icon
            return (
              <button
                key={link.id}
                type="button"
                className={`account-menu__link ${activeTab === link.id ? 'account-menu__link--active' : ''}`}
                onClick={() => setActiveTab(link.id)}
              >
                <Icon size={18} />
                <span>{link.label}</span>
                <ChevronRight size={16} />
              </button>
            )
          })}
        </nav>

        <button type="button" className="account-signout" onClick={handleLogout}>
          Sign out
        </button>
      </aside>

      <div className="account-main">
        {activeTab === 'orders' && (
          <div className="account-section">
            <div className="account-section__header">
              <div>
                <p className="heading-sm text-accent">Orders</p>
                <h2 className="display-md">Order History</h2>
              </div>
            </div>
            <AccountOrdersTab />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="account-section">
            <div className="account-section__header account-section__header--profile">
              <div>
                <p className="heading-sm text-accent">Profile</p>
                <h2 className="display-md">Your Account</h2>
              </div>
              <Badge className="account-badge">Customer</Badge>
            </div>

            <div className="account-hero">
              <div>
                <p className="heading-sm">FABUNIQO Customer</p>
                <h3 className="display-md account-hero__title">{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}</h3>
                <p className="body-lg text-muted">Manage your details, delivery addresses, and upcoming orders from one place.</p>
              </div>  
            </div>

            <div className="account-panel">
              <div className="account-panel__header">
                <div>
                  <p className="heading-sm text-accent">Details</p>
                  <h3 className="display-md">Account information</h3>
                </div>
              </div>

              <div className="form-grid form-grid--2">
                <InputGroup label="Full name">
                  <Input readOnly defaultValue={user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()} />
                </InputGroup>
                <InputGroup label="Email">
                  <Input readOnly defaultValue={user.email} />
                </InputGroup>
                <InputGroup label="Phone number">
                  <Input readOnly defaultValue={user.phone || 'Not provided'} />
                </InputGroup>
                <InputGroup label="Member since">
                  <Input readOnly defaultValue="Today" />
                </InputGroup>
              </div>

              <Separator style={{ marginBlock: 'var(--space-4)' }} />
            </div>
          </div>
        )}

        {activeTab === 'cart' && <AccountCartTab />}
        {activeTab === 'wishlist' && <AccountWishlistTab />}
        {activeTab === 'addresses' && <AccountAddressesTab />}
      </div>
    </div>
  )
}
