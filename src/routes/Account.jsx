import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { Separator } from '@/components/ui/Separator'
import { PointsBadge } from '@/features/loyalty/components/LoyaltySpotlight'
import { login, register as registerUser, logout } from '@/features/auth/api'
import { useAppStore } from '@/store'

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = loginSchema.extend({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
})

const ACCOUNT_LINKS = [
  { id: 'orders', label: 'Orders' },
  { id: 'profile', label: 'Profile' },
  { id: 'addresses', label: 'Addresses' },
]

export default function Account() {
  const user = useAppStore((s) => s.user)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const setUser = useAppStore((s) => s.setUser)
  const clearUser = useAppStore((s) => s.clearUser)
  const [activeTab, setActiveTab] = useState('orders')
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')

  const loginForm = useForm({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm({ resolver: zodResolver(registerSchema) })

  const handleLogin = async (data) => {
    try {
      setAuthError('')
      const userData = await login(data)
      setUser(userData)
    } catch {
      setAuthError('Invalid email or password')
    }
  }

  const handleRegister = async (data) => {
    try {
      setAuthError('')
      const userData = await registerUser(data)
      setUser(userData)
    } catch {
      setAuthError('Registration failed. Please try again.')
    }
  }

  const handleLogout = async () => {
    await logout()
    clearUser()
  }

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ maxWidth: 'var(--container-narrow)', paddingBlock: 'var(--space-6)' }}>
        <h1 className="display-lg" style={{ marginBottom: 'var(--space-4)', textAlign: 'center' }}>
          {authMode === 'login' ? 'Sign In' : 'Create Account'}
        </h1>

        {authError && (
          <p className="text-error body-sm" style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }} role="alert">
            {authError}
          </p>
        )}

        {authMode === 'login' ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} noValidate>
            <div className="form-grid" style={{ gap: 'var(--space-3)' }}>
              <InputGroup label="Email" htmlFor="login-email" error={loginForm.formState.errors.email?.message}>
                <Input id="login-email" type="email" error={loginForm.formState.errors.email} {...loginForm.register('email')} />
              </InputGroup>
              <InputGroup label="Password" htmlFor="login-password" error={loginForm.formState.errors.password?.message}>
                <Input id="login-password" type="password" error={loginForm.formState.errors.password} {...loginForm.register('password')} />
              </InputGroup>
              <Button type="submit" variant="primary" fullWidth disabled={loginForm.formState.isSubmitting}>
                Sign In
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} noValidate>
            <div className="form-grid" style={{ gap: 'var(--space-3)' }}>
              <div className="form-grid form-grid--2">
                <InputGroup label="First Name" htmlFor="reg-first" error={registerForm.formState.errors.firstName?.message}>
                  <Input id="reg-first" error={registerForm.formState.errors.firstName} {...registerForm.register('firstName')} />
                </InputGroup>
                <InputGroup label="Last Name" htmlFor="reg-last" error={registerForm.formState.errors.lastName?.message}>
                  <Input id="reg-last" error={registerForm.formState.errors.lastName} {...registerForm.register('lastName')} />
                </InputGroup>
              </div>
              <InputGroup label="Email" htmlFor="reg-email" error={registerForm.formState.errors.email?.message}>
                <Input id="reg-email" type="email" error={registerForm.formState.errors.email} {...registerForm.register('email')} />
              </InputGroup>
              <InputGroup label="Password" htmlFor="reg-password" error={registerForm.formState.errors.password?.message}>
                <Input id="reg-password" type="password" error={registerForm.formState.errors.password} {...registerForm.register('password')} />
              </InputGroup>
              <Button type="submit" variant="primary" fullWidth disabled={registerForm.formState.isSubmitting}>
                Create Account
              </Button>
            </div>
          </form>
        )}

        <p className="body-sm text-muted" style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
          {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            className="section-header__link"
            onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('') }}
          >
            {authMode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="container account-layout">
      <aside>
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <p className="display-md">{user.firstName} {user.lastName}</p>
          <p className="body-sm text-muted">{user.email}</p>
          <div style={{ marginTop: 'var(--space-1)' }}><PointsBadge /></div>
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

      <div>
        {activeTab === 'orders' && (
          <div>
            <h2 className="display-md" style={{ marginBottom: 'var(--space-3)' }}>Order History</h2>
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <p className="body-lg text-muted">No orders yet. Start shopping to see your orders here.</p>
            </div>
          </div>
        )}
        {activeTab === 'profile' && (
          <div>
            <h2 className="display-md" style={{ marginBottom: 'var(--space-3)' }}>Profile</h2>
            <div className="form-grid form-grid--2">
              <InputGroup label="First Name"><Input defaultValue={user.firstName} readOnly /></InputGroup>
              <InputGroup label="Last Name"><Input defaultValue={user.lastName} readOnly /></InputGroup>
              <InputGroup label="Email"><Input defaultValue={user.email} readOnly /></InputGroup>
            </div>
          </div>
        )}
        {activeTab === 'addresses' && (
          <div>
            <h2 className="display-md" style={{ marginBottom: 'var(--space-3)' }}>Saved Addresses</h2>
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <p className="body-lg text-muted">No saved addresses yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
