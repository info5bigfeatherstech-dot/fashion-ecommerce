import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ChevronRight, Heart, MapPin, Package, Plus, ShoppingBag, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, InputGroup } from '@/components/ui/Input'
import { Separator } from '@/components/ui/Separator'
import { Modal } from '@/components/ui/Modal'
import { CheckoutAddressModal } from '@/components/checkout/CheckoutAddressModal'
import { CartItem } from '@/features/cart/components/CartItem'
import { AuthForms } from '@/features/auth/components/AuthForms'
import { logout } from '@/features/auth/api'
import { AddressFormFields } from '@/features/address/components/AddressFormFields'
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from '@/features/address/hooks'
import { applyFieldErrors } from '@/features/address/mappers'
import { ADDRESS_FORM_DEFAULTS, addressFormSchema } from '@/features/address/schema'
import { WishlistProductGrid } from '@/features/wishlist/components/WishlistProductGrid'
import { useCart, useCartProducts } from '@/features/cart/hooks'
import { useWishlist } from '@/features/wishlist/hooks'
import { useAppStore } from '@/store'
import { useCartTotal } from '@/store/selectors'
import { formatPrice } from '@/lib/utils'

const ACCOUNT_QUICK_LINKS = [
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'cart', label: 'Cart', icon: ShoppingBag },
]

const ACCOUNT_MENU_LINKS = [
  { id: 'profile', label: 'Profile information', icon: UserRound },
  { id: 'addresses', label: 'Saved addresses', icon: MapPin },
]

export default function Account({
  initialAuthMode = 'login',
  initialActiveTab = 'orders',
  authGateMode = 'modal',
} = {}) {
  const user = useAppStore((s) => s.user)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const setSession = useAppStore((s) => s.setSession)
  const clearUser = useAppStore((s) => s.clearUser)
  const cartItems = useAppStore((s) => s.cartItems)
  const wishlistItems = useAppStore((s) => s.wishlistItems)
  const cartTotal = useCartTotal()
  const location = useLocation()
  const navigate = useNavigate()
  const redirectTo = location.state?.redirectTo
  const [activeTab, setActiveTab] = useState(initialActiveTab)
  const [authMode, setAuthMode] = useState(initialAuthMode)
  const [authError, setAuthError] = useState('')
  const [authModalOpen, setAuthModalOpen] = useState(true)
  const [checkoutAddressOpen, setCheckoutAddressOpen] = useState(false)
  const [addressFormError, setAddressFormError] = useState('')
  const [showAddressForm, setShowAddressForm] = useState(false)

  useCart({ enabled: isAuthenticated && (activeTab === 'cart' || activeTab === 'orders') })
  useWishlist({ enabled: isAuthenticated && activeTab === 'wishlist' })

  const { products: hydratedCartItems } = useCartProducts(cartItems, {
    enabled: isAuthenticated && activeTab === 'cart' && cartItems.length > 0,
  })

  const {
    data: addressData,
    isLoading: addressesLoading,
    isError: addressesFailed,
    error: addressesError,
  } = useAddresses({ enabled: isAuthenticated })
  const createAddress = useCreateAddress()
  const deleteAddress = useDeleteAddress()
  const setDefaultAddress = useSetDefaultAddress()

  const addresses = addressData?.all || []

  const addressForm = useForm({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      ...ADDRESS_FORM_DEFAULTS,
      fullName: user?.name || '',
      phone: user?.phone || '',
    },
  })

  const handleAuthenticated = (session) => {
    // API layer already wrote accessToken into Zustand memory; ensure session is synced.
    if (session?.user) {
      setSession({
        user: session.user,
        accessToken: session.accessToken || useAppStore.getState().accessToken,
      })
    }
    setAuthError('')
    navigate(redirectTo || '/profile', { replace: true })
  }

  const handleLogout = async () => {
    await logout()
    clearUser()
  }

  const openAddressForm = () => {
    setAddressFormError('')
    addressForm.reset({
      ...ADDRESS_FORM_DEFAULTS,
      fullName: user?.name || '',
      phone: user?.phone || '',
    })
    setShowAddressForm(true)
  }

  const closeAddressForm = () => {
    setAddressFormError('')
    setShowAddressForm(false)
  }

  const handleAddAddress = async (data) => {
    setAddressFormError('')
    try {
      const result = await createAddress.mutateAsync(data)
      toast.success(result.message || 'Address saved')
      addressForm.reset({
        ...ADDRESS_FORM_DEFAULTS,
        fullName: user?.name || data.fullName || '',
        phone: user?.phone || '',
      })
      setShowAddressForm(false)
    } catch (err) {
      const applied = applyFieldErrors(err, addressForm.setError)
      if (!applied) {
        setAddressFormError(err?.message || 'Could not save address')
        toast.error(err?.message || 'Could not save address')
      }
    }
  }

  const handleRemoveAddress = async (id) => {
    try {
      const result = await deleteAddress.mutateAsync(id)
      const checkout = useAppStore.getState().checkoutAddress
      if (checkout?.id === id) {
        useAppStore.getState().clearCheckoutAddress()
      }
      toast.success(result.message || 'Address removed')
    } catch (err) {
      toast.error(err?.message || 'Could not remove address')
    }
  }

  const handleSetDefault = async (id) => {
    try {
      const result = await setDefaultAddress.mutateAsync(id)
      toast.success(result.message || 'Default address updated')
    } catch (err) {
      toast.error(err?.message || 'Could not update default address')
    }
  }

  useEffect(() => {
    setAuthMode(initialAuthMode)
    setAuthError('')
  }, [initialAuthMode])

  useEffect(() => {
    setActiveTab(initialActiveTab)
  }, [initialActiveTab])

  useEffect(() => {
    if (activeTab !== 'addresses') {
      setShowAddressForm(false)
      setAddressFormError('')
    }
  }, [activeTab])

  useEffect(() => {
    if (authGateMode === 'modal') {
      setAuthModalOpen(true)
    }
  }, [authGateMode, location.pathname])

  useEffect(() => {
    if (!user) return
    addressForm.reset({
      ...ADDRESS_FORM_DEFAULTS,
      fullName: user.name || '',
      phone: user.phone || '',
    })
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated) {
    if (authGateMode === 'modal') {
      const isRegisterLayout = authMode === 'register'
      return (
        <Modal
          open={authModalOpen}
          onOpenChange={(open) => {
            setAuthModalOpen(open)
            if (!open) navigate('/')
          }}
          title={authMode === 'login' ? 'Sign In' : 'Create Account'}
          className={isRegisterLayout ? 'modal-content--auth modal-content--auth-register' : 'modal-content--auth'}
        >
          <div className={isRegisterLayout ? 'auth-modal auth-modal--register' : 'auth-modal'}>
            {isRegisterLayout ? (
              <>
                <div className="auth-modal__register-hero" aria-hidden="true">
                  <div className="auth-modal__register-hero-inner">
                    <p className="auth-modal__eyebrow">Create Account</p>
                    <h3
                      className="display-md auth-modal__register-title"
                      style={{ marginBottom: 'var(--space-1)', fontFamily: 'var(--font-italic-serif)' }}
                    >
                      Join the Fashion circle
                    </h3>
                    <p className="body-sm auth-modal__register-subtitle">
                      Get early access to drops, save your wishlist, and check out faster.
                    </p>
                    <div className="auth-modal__register-features">
                      <span>Wishlist saving</span>
                      <span>Faster checkout later</span>
                      <span>Member-only drops</span>
                    </div>
                  </div>
                </div>

                <div className="auth-modal__register-body">
                  <AuthForms
                    mode={authMode}
                    onModeChange={setAuthMode}
                    onAuthenticated={handleAuthenticated}
                    error={authError}
                    setError={setAuthError}
                  />

                  <div className="auth-modal__register-side">
                    <div className="card" style={{ padding: 'var(--space-4)' }}>
                      <p className="heading-sm text-accent" style={{ marginBottom: 'var(--space-2)' }}>
                        What you get
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '18px' }}>
                        <li className="body-sm" style={{ marginBottom: 'var(--space-1)' }}>Save wishlist items</li>
                        <li className="body-sm" style={{ marginBottom: 'var(--space-1)' }}>Quick checkout </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="auth-modal__grid">
                <div className="auth-modal__side">
                  <p className="heading-sm text-accent" style={{ marginBottom: 'var(--space-2)' }}>
                    Fashion
                  </p>
                  <h3 className="display-md" style={{ marginBottom: 'var(--space-1)' }}>
                    Shine with pieces made to wear daily.
                  </h3>
                  <div className="card" style={{ padding: 'var(--space-2)' }}>
                    <p className="body-sm" style={{ marginBottom: 'var(--space-2)' }}>
                      Save your favorites, add to bag quickly, and manage your profile.
                    </p>
                  </div>
                </div>

                <AuthForms
                  mode={authMode}
                  onModeChange={setAuthMode}
                  onAuthenticated={handleAuthenticated}
                  error={authError}
                  setError={setAuthError}
                />
              </div>
            )}
          </div>
        </Modal>
      )
    }

    return (
      <div className="container" style={{ maxWidth: 'var(--container-narrow)', paddingBlock: 'var(--space-6)' }}>
        <h1 className="display-lg" style={{ marginBottom: 'var(--space-3)', textAlign: 'center' }}>
          Profile
        </h1>
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <p className="body-lg text-muted" style={{ marginBottom: 'var(--space-4)' }}>
            Please sign in to view your profile and manage saved addresses.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Link to="/login" state={{ redirectTo: '/profile' }}>
              <Button variant="primary">Sign in</Button>
            </Link>
            <Link to="/register" state={{ redirectTo: '/profile' }}>
              <Button variant="secondary">Create account</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
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
            const count =
              link.id === 'cart' ? cartItems.reduce((sum, item) => sum + item.quantity, 0)
              : link.id === 'wishlist' ? wishlistItems.length
              : 0

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
            <div className="account-panel">
              <div className="account-empty">
                <div className="account-empty__icon"><Package size={22} /></div>
                <p className="body-lg">No orders yet</p>
                <p className="body-sm text-muted">Start shopping to see your orders here.</p>
              </div>
            </div>
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

            {/* <div className="account-stats">
              <div className="account-stat-card">
                <Mail size={18} />
                <div>
                  <p className="account-stat-card__label">Email</p>
                  <p className="account-stat-card__value">{user.email}</p>
                </div>
              </div>
              <div className="account-stat-card">
                <Phone size={18} />
                <div>
                  <p className="account-stat-card__label">Phone</p>
                  <p className="account-stat-card__value">Not provided</p>
                </div>
              </div>
              <div className="account-stat-card">
                <MapPin size={18} />
                <div>
                  <p className="account-stat-card__label">Saved addresses</p>
                  <p className="account-stat-card__value">{addresses.length}</p>
                </div>
              </div>
              <div className="account-stat-card">
                <CalendarDays size={18} />
                <div>
                  <p className="account-stat-card__label">Member since</p>
                  <p className="account-stat-card__value">Today</p>
                </div>
              </div>
            </div> */}

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
                  <Input readOnly defaultValue="Not provided" />
                </InputGroup>
                <InputGroup label="Member since">
                  <Input readOnly defaultValue="Today" />
                </InputGroup>
              </div>

              <Separator style={{ marginBlock: 'var(--space-4)' }} />

                {/* <div className="account-note">
                  <Sparkles size={16} />
                  <p className="body-sm text-muted">Profile UI is ready. Later, we can connect editing and real customer data through your backend.</p>
                </div> */}
            </div>
          </div>
        )}

        {activeTab === 'cart' && (() => {
          const bagCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)

          return (
          <div className="account-section">
            <div className="account-section__header">
              <div>
                <p className="heading-sm text-accent">Bag</p>
                <h2 className="display-md">Shopping Bag</h2>
                {cartItems.length > 0 && (
                  <p className="body-sm text-muted" style={{ marginTop: 4 }}>
                    {bagCount} {bagCount === 1 ? 'item' : 'items'} selected
                  </p>
                )}
              </div>
              {cartItems.length > 0 && (
                <Link to="/cart">
                  <Button variant="secondary" size="sm">Open full bag</Button>
                </Link>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="account-panel">
                <div className="account-empty">
                  <div className="account-empty__icon"><ShoppingBag size={22} /></div>
                  <p className="body-lg">Your bag is empty</p>
                  <p className="body-sm text-muted">Add jewelry you love and it will show up here.</p>
                  <Link to="/shop/women" style={{ marginTop: 'var(--space-2)' }}>
                    <Button variant="primary">Start shopping</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="account-bag">
                <section className="account-bag__list" aria-label="Bag items">
                  {hydratedCartItems.map((item) => (
                    <CartItem key={item.id} item={item} layout="account" />
                  ))}
                </section>

                <aside className="account-bag__summary">
                  <p className="account-bag__summary-label">Order summary</p>
                  <div className="account-bag__summary-rows">
                    <div className="account-bag__summary-row">
                      <span>Subtotal</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="account-bag__summary-row account-bag__summary-row--muted">
                      <span>Shipping</span>
                      <span>Calculated at checkout</span>
                    </div>
                    <div className="account-bag__summary-total">
                      <span>Total</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    fullWidth
                    className="account-bag__cta"
                    onClick={() => setCheckoutAddressOpen(true)}
                  >
                    Proceed to checkout
                  </Button>
                  <Link to="/shop/women" className="account-bag__continue">
                    Continue shopping
                  </Link>
                </aside>
              </div>
            )}
          </div>
          )
        })()}

        {activeTab === 'wishlist' && (
          <div className="account-section">
            <div className="account-section__header">
              <div>
                <p className="heading-sm text-accent">Saved</p>
                <h2 className="display-md">Wishlist</h2>
                {wishlistItems.length > 0 && (
                  <p className="body-sm text-muted" style={{ marginTop: 4 }}>
                    {wishlistItems.length} {wishlistItems.length === 1 ? 'piece' : 'pieces'} saved
                  </p>
                )}
              </div>
              {wishlistItems.length > 0 && (
                <Link to="/wishlist">
                  <Button variant="secondary" size="sm">Open full wishlist</Button>
                </Link>
              )}
            </div>

            {wishlistItems.length === 0 ? (
              <div className="account-panel">
                <div className="account-empty">
                  <div className="account-empty__icon"><Heart size={22} /></div>
                  <p className="body-lg">Your wishlist is empty</p>
                  <p className="body-sm text-muted">Tap the heart on any product and it will appear here.</p>
                  <Link to="/shop/women" style={{ marginTop: 'var(--space-2)' }}>
                    <Button variant="primary">Explore jewelry</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <WishlistProductGrid
                wishlistItems={wishlistItems}
                enabled={isAuthenticated && activeTab === 'wishlist' && wishlistItems.length > 0}
                className="account-wishlist-grid"
                defaultView="list"
              />
            )}
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="account-section">
            <div className="account-section__header">
              <div>
                <p className="heading-sm text-accent">Addresses</p>
                <h2 className="display-md">Saved Addresses</h2>
              </div>
              {!addressesLoading && !addressesFailed && !showAddressForm && addresses.length > 0 && (
                <Button variant="secondary" size="sm" onClick={openAddressForm}>
                  <Plus size={16} />
                  Add address
                </Button>
              )}
            </div>

            {addressesLoading ? (
              <div className="account-panel">
                <p className="body-lg text-muted">Loading addresses…</p>
              </div>
            ) : addressesFailed ? (
              <div className="account-panel">
                <p className="body-lg" style={{ color: 'var(--color-danger, #b42318)' }}>
                  {addressesError?.message || 'Could not load addresses.'}
                </p>
              </div>
            ) : showAddressForm ? (
              <div className="account-panel account-panel--address-form">
                <div className="account-panel__header account-address-form__header">
                  <div>
                    <p className="heading-sm text-accent">New address</p>
                    <h3 className="display-md">
                      {addresses.length === 0 ? 'Add your address' : 'Add a new address'}
                    </h3>
                    <p className="body-sm text-muted account-address-form__lede">
                      Enter your delivery details so checkout is faster next time.
                    </p>
                  </div>
                </div>

                <form
                  className="account-address-form"
                  onSubmit={addressForm.handleSubmit(handleAddAddress)}
                  noValidate
                >
                  <AddressFormFields
                    register={addressForm.register}
                    control={addressForm.control}
                    errors={addressForm.formState.errors}
                    idPrefix="account-addr"
                  />

                  {addressFormError && (
                    <p className="body-sm account-address-form__error">
                      {addressFormError}
                    </p>
                  )}

                  <div className="address-form__actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={closeAddressForm}
                      disabled={createAddress.isPending || addressForm.formState.isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={createAddress.isPending || addressForm.formState.isSubmitting}
                    >
                      {createAddress.isPending ? 'Saving…' : 'Save address'}
                    </Button>
                  </div>
                </form>
              </div>
            ) : addresses.length === 0 ? (
              <div className="account-panel">
                <div className="account-empty">
                  <div className="account-empty__icon"><MapPin size={22} /></div>
                  <p className="body-lg">No saved addresses yet</p>
                  <p className="body-sm text-muted">
                    Add your first delivery address to speed up future checkout.
                  </p>
                  <Button
                    variant="primary"
                    style={{ marginTop: 'var(--space-3)' }}
                    onClick={openAddressForm}
                  >
                    <Plus size={16} />
                    Add address
                  </Button>
                </div>
              </div>
            ) : (
              <div className="account-address-list">
                {addresses.map((addr) => (
                  <article key={addr.id} className="account-address-card">
                    <div className="account-address-card__head">
                      <p className="account-address-card__name">{addr.fullName}</p>
                      <Badge className="account-badge">
                        {addr.isDefault ? 'Default' : addr.addressType || 'Saved'}
                      </Badge>
                    </div>
                    <div className="account-address-card__body">
                      <p>{addr.displayLine1 || addr.fullAddress}</p>
                      {addr.displayLine2 && <p>{addr.displayLine2}</p>}
                      <p>
                        {[addr.city, addr.state].filter(Boolean).join(', ')}
                        {(addr.postalCode || addr.zip) ? ` · ${addr.postalCode || addr.zip}` : ''}
                      </p>
                      {addr.phone && <p className="account-address-card__phone">Phone: {addr.phone}</p>}
                    </div>
                    <div className="account-address-card__actions">
                      {!addr.isDefault && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={setDefaultAddress.isPending}
                          onClick={() => handleSetDefault(addr.id)}
                        >
                          Set default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deleteAddress.isPending}
                        onClick={() => handleRemoveAddress(addr.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

      <CheckoutAddressModal
        open={checkoutAddressOpen}
        onOpenChange={setCheckoutAddressOpen}
        onProceed={() => navigate('/checkout')}
      />
    </>
  )
}
