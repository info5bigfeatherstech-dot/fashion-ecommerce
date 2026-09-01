import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock, User } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminLogin } from '@/features/admin/hooks'
import { useAdminStore } from '@/features/admin/store'

export default function AdminLogin() {
  const navigate = useNavigate()
  const authReady = useAdminStore((s) => s.authReady)
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated)
  const login = useAdminLogin()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (authReady && isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    try {
      const res = await login.mutateAsync({ identifier: identifier.trim(), password })
      const userName = res?.user?.name || res?.user?.email || 'Admin'
      toast.success('Logged in successfully', {
        description: `Welcome back to admin panel, ${userName}!`,
        duration: 4000,
      })
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      toast.error('Login failed', {
        description: err?.message || 'Please check your credentials and try again.',
      })
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__header">
          <h1 className="admin-login__title">
            ADMIN PANEL <span className="admin-login__title-accent">ACCESS</span>
          </h1>
          <p className="admin-login__subtitle">
            RESTRICTED AREA — AUTHORISED PERSONNEL ONLY
          </p>
        </div>

        <form className="admin-login__form" onSubmit={onSubmit}>
          <div className="admin-login__field">
            <User size={18} className="admin-login__icon" aria-hidden />
            <input
              id="adminIdentifier"
              type="text"
              inputMode="email"
              autoComplete="username"
              placeholder="Email or Phone Number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="admin-login__field">
            <Lock size={18} className="admin-login__icon" aria-hidden />
            <input
              id="adminPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="admin-login__eye-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="admin-login__submit-btn"
            disabled={login.isPending}
          >
            {login.isPending ? (
              <Loader2 size={18} className="admin-staff__spin" />
            ) : null}
            {login.isPending ? 'SIGNING IN…' : 'SIGN IN TO DASHBOARD'}
          </button>
        </form>

        <p className="admin-login__footer">
          ALL ACCESS ATTEMPTS ARE LOGGED
        </p>

        <p className="body-sm text-muted admin-login__back">
          <Link to="/">← Back to store</Link>
        </p>
      </div>
    </div>
  )
}
