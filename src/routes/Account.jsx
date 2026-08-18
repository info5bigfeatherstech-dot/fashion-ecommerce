import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarDays, Mail, MapPin, Package, Phone, Sparkles, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, InputGroup } from '@/components/ui/Input'
import { Separator } from '@/components/ui/Separator'
import { Modal } from '@/components/ui/Modal'
import { PointsBadge } from '@/features/loyalty/components/LoyaltySpotlight'
import { login, register as registerUser, logout } from '@/features/auth/api'
import { useAppStore } from '@/store'

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Valid email required'),
    phone: z
      .string()
      .min(8, 'Phone number is required')
      .max(20, 'Phone number looks too long'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
})

const addressSchema = z
  .object({
    fullAddress: z.string().min(3, 'Address required'),
    city: z.string().min(1, 'City required'),
    state: z.string().min(1, 'State required'),
    zip: z.string().min(3, 'ZIP code required').max(10, 'ZIP code too long'),
    phone: z
      .string()
      .optional()
      .refine((v) => !v || v.replace(/\D/g, '').length >= 8, 'Phone number looks too short'),
  })

const ACCOUNT_LINKS = [
  { id: 'profile', label: 'Profile' },
  { id: 'orders', label: 'Orders' },
  { id: 'addresses', label: 'Addresses' },
]

export default function Account({
  initialAuthMode = 'login',
  initialActiveTab = 'orders',
  authGateMode = 'modal',
} = {}) {
  const user = useAppStore((s) => s.user)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const setUser = useAppStore((s) => s.setUser)
  const clearUser = useAppStore((s) => s.clearUser)
  const addresses = useAppStore((s) => s.addresses)
  const addAddress = useAppStore((s) => s.addAddress)
  const removeAddress = useAppStore((s) => s.removeAddress)
  const location = useLocation()
  const navigate = useNavigate()
  const redirectTo = location.state?.redirectTo
  const [activeTab, setActiveTab] = useState(initialActiveTab)
  const [authMode, setAuthMode] = useState(initialAuthMode)
  const [authError, setAuthError] = useState('')
  const [authModalOpen, setAuthModalOpen] = useState(true)

  const loginForm = useForm({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm({ resolver: zodResolver(registerSchema) })
  const addressForm = useForm({ resolver: zodResolver(addressSchema) })

  const handleLogin = async (data) => {
    try {
      setAuthError('')
      const userData = await login(data)
      setUser(userData)
      navigate(redirectTo || '/profile', { replace: true })
    } catch {
      setAuthError('Invalid email or password')
    }
  }

  const handleRegister = async (data) => {
    try {
      setAuthError('')
      // Backend/API still expects first/last name (for now); derive them from full name.
      const parts = data.fullName.trim().split(/\s+/)
      const firstName = parts[0] ?? ''
      const lastName = parts.slice(1).join(' ')

      const userData = await registerUser({
        firstName,
        lastName,
        email: data.email,
        password: data.password,
      })
      setUser(userData)
      navigate(redirectTo || '/profile', { replace: true })
    } catch {
      setAuthError('Registration failed. Please try again.')
    }
  }

  const handleLogout = async () => {
    await logout()
    clearUser()
  }

  const handleAddAddress = async (data) => {
    addAddress({
      fullAddress: data.fullAddress,
      city: data.city,
      state: data.state,
      zip: data.zip,
      phone: data.phone || undefined,
    })
    addressForm.reset()
  }

  useEffect(() => {
    setAuthMode(initialAuthMode)
    setAuthError('')
  }, [initialAuthMode])

  useEffect(() => {
    setActiveTab(initialActiveTab)
  }, [initialActiveTab])

  useEffect(() => {
    if (authGateMode === 'modal') {
      setAuthModalOpen(true)
    }
  }, [authGateMode, location.pathname])

  if (!isAuthenticated) {
    if (authGateMode === 'modal') {
      return (
        <Modal
          open={authModalOpen}
          onOpenChange={(open) => {
            setAuthModalOpen(open)
            if (!open) navigate('/')
          }}
          title={authMode === 'login' ? 'Sign In' : 'Create Account'}
          className={authMode === 'register' ? 'modal-content--auth modal-content--auth-register' : 'modal-content--auth'}
        >
          <div className={authMode === 'register' ? 'auth-modal auth-modal--register' : 'auth-modal'}>
            {authMode === 'register' ? (
              <>
                <div className="auth-modal__register-hero" aria-hidden="true">
                  <div className="auth-modal__register-hero-inner">
                    <p className="auth-modal__eyebrow">Create Account</p>
                    <h3
                      className="display-lg auth-modal__register-title"
                      style={{ marginBottom: 'var(--space-2)', fontFamily: 'var(--font-italic-serif)' }}
                    >
                      Join the Fashion circle
                    </h3>
                    <p className="body-lg auth-modal__register-subtitle">
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
                  <div className="auth-modal__register-form">
                    {authError && (
                      <p className="text-error body-sm" style={{ marginBottom: 'var(--space-3)' }} role="alert">
                        {authError}
                      </p>
                    )}

                    <form onSubmit={registerForm.handleSubmit(handleRegister)} noValidate>
                      <div className="form-grid" style={{ gap: 'var(--space-3)' }}>
                        <div className="form-grid form-grid--2">
                          <InputGroup label="Full Name" htmlFor="reg-full-name" error={registerForm.formState.errors.fullName?.message}>
                            <Input
                              id="reg-full-name"
                              placeholder="Alex Chen"
                              error={registerForm.formState.errors.fullName}
                              {...registerForm.register('fullName')}
                            />
                          </InputGroup>
                          <InputGroup label="Phone Number" htmlFor="reg-phone" error={registerForm.formState.errors.phone?.message}>
                            <Input
                              id="reg-phone"
                              type="tel"
                              placeholder="+1 555 123 4567"
                              error={registerForm.formState.errors.phone}
                              {...registerForm.register('phone')}
                            />
                          </InputGroup>
                        </div>

                        <InputGroup label="Email" htmlFor="reg-email" error={registerForm.formState.errors.email?.message}>
                          <Input
                            id="reg-email"
                            type="email"
                            placeholder="you@example.com"
                            error={registerForm.formState.errors.email}
                            {...registerForm.register('email')}
                          />
                        </InputGroup>

                        <div className="form-grid form-grid--2">
                          <InputGroup label="Password" htmlFor="reg-password" error={registerForm.formState.errors.password?.message}>
                            <Input
                              id="reg-password"
                              type="password"
                              placeholder="Create a password"
                              error={registerForm.formState.errors.password}
                              {...registerForm.register('password')}
                            />
                          </InputGroup>
                          <InputGroup
                            label="Confirm Password"
                            htmlFor="reg-confirm-password"
                            error={registerForm.formState.errors.confirmPassword?.message}
                          >
                            <Input
                              id="reg-confirm-password"
                              type="password"
                              placeholder="Re-enter your password"
                              error={registerForm.formState.errors.confirmPassword}
                              {...registerForm.register('confirmPassword')}
                            />
                          </InputGroup>
                        </div>

                        <Button type="submit" variant="accent" fullWidth disabled={registerForm.formState.isSubmitting}>
                          Create Account
                        </Button>

                        <p className="body-sm text-muted" style={{ textAlign: 'center' }}>
                          Already have an account?{' '}
                          <button
                            className="section-header__link"
                            type="button"
                            onClick={() => {
                              setAuthMode('login')
                              setAuthError('')
                            }}
                          >
                            Sign in
                          </button>
                        </p>
                      </div>
                    </form>
                  </div>

                  <div className="auth-modal__register-side">
                    <div className="card" style={{ padding: 'var(--space-4)' }}>
                      <p className="heading-sm text-accent" style={{ marginBottom: 'var(--space-2)' }}>
                        What you get
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '18px' }}>
                        <li className="body-sm" style={{ marginBottom: 'var(--space-1)' }}>Save wishlist items</li>
                        <li className="body-sm" style={{ marginBottom: 'var(--space-1)' }}>Quick checkout </li>
                      </ul>
                      <p className="body-sm text-muted" style={{ marginTop: 'var(--space-3)' }}>
                        UI is ready now; authentication API can be added later.
                      </p>
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
                  <h3 className="display-md" style={{ marginBottom: 'var(--space-2)' }}>
                    Shine with pieces made to wear daily.
                  </h3>
                  <div className="card" style={{ padding: 'var(--space-3)' }}>
                    <p className="body-sm" style={{ marginBottom: 'var(--space-2)' }}>
                      Save your favorites, add to bag quickly, and manage your profile.
                    </p>
                  </div>
                </div>

                <div className="auth-modal__form">
                  {authError && (
                    <p className="text-error body-sm" style={{ marginBottom: 'var(--space-3)' }} role="alert">
                      {authError}
                    </p>
                  )}

                  <form onSubmit={loginForm.handleSubmit(handleLogin)} noValidate>
                    <div className="form-grid" style={{ gap: 'var(--space-3)' }}>
                      <InputGroup label="Email" htmlFor="login-email" error={loginForm.formState.errors.email?.message}>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          error={loginForm.formState.errors.email}
                          {...loginForm.register('email')}
                        />
                      </InputGroup>
                      <InputGroup label="Password" htmlFor="login-password" error={loginForm.formState.errors.password?.message}>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Your password"
                          error={loginForm.formState.errors.password}
                          {...loginForm.register('password')}
                        />
                      </InputGroup>

                      <Button type="submit" variant="primary" fullWidth disabled={loginForm.formState.isSubmitting}>
                        Sign In
                      </Button>
                    </div>

                    <p className="body-sm text-muted" style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
                      <button
                        className="section-header__link"
                        type="button"
                        onClick={() => {
                          setAuthMode('register')
                          setAuthError('')
                        }}
                      >
                        Create an account
                      </button>
                    </p>
                  </form>
                </div>
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
    <div className="container account-layout">
      <aside className="account-sidebar">
        <div className="account-sidebar__card">
          <div className="account-sidebar__avatar">
            <UserRound size={24} />
          </div>
          <p className="display-md">{user.firstName} {user.lastName}</p>
          <p className="body-sm text-muted">{user.email}</p>
          <div style={{ marginTop: 'var(--space-2)' }}><PointsBadge /></div>
        </div>
        <nav className="account-nav" aria-label="Account navigation">
          {ACCOUNT_LINKS.map((link) => (
            <button
              key={link.id}
              className={`account-nav__link ${activeTab === link.id ? 'account-nav__link--active' : ''}`}
              onClick={() => setActiveTab(link.id)}
            >
              {link.label}
            </button>
          ))}
        </nav>
        <Separator style={{ marginBlock: 'var(--space-3)' }} />
        <Button variant="ghost" onClick={handleLogout}>Sign Out</Button>
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
            <div className="account-section__header">
              <div>
                <p className="heading-sm text-accent">Profile</p>
                <h2 className="display-md">Your Account</h2>
              </div>
              <Badge className="account-badge">Active member</Badge>
            </div>

            <div className="account-hero">
              <div>
                <p className="heading-sm">VERAÒ Customer</p>
                <h3 className="display-md account-hero__title">{user.firstName} {user.lastName}</h3>
                <p className="body-lg text-muted">Manage your details, delivery addresses, and upcoming orders from one place.</p>
              </div>
              <div className="account-hero__points">
                <PointsBadge />
              </div>
            </div>

            <div className="account-stats">
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
                  <Input readOnly defaultValue={`${user.firstName} ${user.lastName}`} />
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

              <div className="account-note">
                <Sparkles size={16} />
                <p className="body-sm text-muted">Profile UI is ready. Later, we can connect editing and real customer data through your backend.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="account-section">
            <div className="account-section__header">
              <div>
                <p className="heading-sm text-accent">Addresses</p>
                <h2 className="display-md">Saved Addresses</h2>
              </div>
            </div>

            <div className="account-panel" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="account-panel__header">
                <div>
                  <p className="heading-sm text-accent">Add</p>
                  <h3 className="display-md">Add a new address</h3>
                </div>
              </div>

              <form onSubmit={addressForm.handleSubmit(handleAddAddress)} noValidate>
                <div className="form-grid" style={{ gap: 'var(--space-3)' }}>
                  <InputGroup
                    label="Full address"
                    htmlFor="addr-full"
                    error={addressForm.formState.errors.fullAddress?.message}
                  >
                    <Input
                      id="addr-full"
                      placeholder="House no, street, apartment, etc."
                      error={addressForm.formState.errors.fullAddress}
                      {...addressForm.register('fullAddress')}
                    />
                  </InputGroup>

                  <div className="form-grid form-grid--2">
                    <InputGroup
                      label="City"
                      htmlFor="addr-city"
                      error={addressForm.formState.errors.city?.message}
                    >
                      <Input id="addr-city" placeholder="City" error={addressForm.formState.errors.city} {...addressForm.register('city')} />
                    </InputGroup>
                    <InputGroup
                      label="State"
                      htmlFor="addr-state"
                      error={addressForm.formState.errors.state?.message}
                    >
                      <Input id="addr-state" placeholder="State" error={addressForm.formState.errors.state} {...addressForm.register('state')} />
                    </InputGroup>
                  </div>

                  <div className="form-grid form-grid--2">
                    <InputGroup
                      label="ZIP Code"
                      htmlFor="addr-zip"
                      error={addressForm.formState.errors.zip?.message}
                    >
                      <Input id="addr-zip" placeholder="ZIP" error={addressForm.formState.errors.zip} {...addressForm.register('zip')} />
                    </InputGroup>
                    <InputGroup
                      label="Phone (optional)"
                      htmlFor="addr-phone"
                      error={addressForm.formState.errors.phone?.message}
                    >
                      <Input
                        id="addr-phone"
                        type="tel"
                        placeholder="+1 555 123 4567"
                        error={addressForm.formState.errors.phone}
                        {...addressForm.register('phone')}
                      />
                    </InputGroup>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={addressForm.formState.isSubmitting}
                  >
                    Save address
                  </Button>
                </div>
              </form>
            </div>

            {addresses.length === 0 ? (
              <div className="account-panel">
                <div className="account-empty">
                  <div className="account-empty__icon"><MapPin size={22} /></div>
                  <p className="body-lg">No saved addresses yet</p>
                  <p className="body-sm text-muted">Add your first delivery address to speed up future checkout.</p>
                </div>
              </div>
            ) : (
              <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
                {addresses.map((addr) => (
                  <div key={addr.id} className="account-address-card">
                    <div className="account-address-card__head">
                      <p className="heading-sm" style={{ marginBottom: 0 }}>Delivery address</p>
                      <Badge className="account-badge">Saved</Badge>
                    </div>
                    <p className="body-lg" style={{ marginBottom: 'var(--space-2)' }}>{addr.fullAddress}</p>
                    <p className="body-sm text-muted" style={{ marginBottom: 'var(--space-2)' }}>
                      {addr.city}, {addr.state} · {addr.zip}
                    </p>
                    {addr.phone && <p className="body-sm text-muted" style={{ marginBottom: 'var(--space-2)' }}>Phone: {addr.phone}</p>}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAddress(addr.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
