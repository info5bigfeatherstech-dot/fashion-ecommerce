import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { SITE_NAME } from '@/config/site'
import { useAdminLogin } from '@/features/admin/hooks'
import { useAdminStore } from '@/features/admin/store'

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const authReady = useAdminStore((s) => s.authReady)
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated)
  const login = useAdminLogin()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')

  const redirectTo = location.state?.from || '/admin/orders'

  if (authReady && isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    try {
      await login.mutateAsync({ identifier: identifier.trim(), password })
      toast.success('Welcome back')
      navigate(redirectTo, { replace: true })
    } catch (err) {
      toast.error(err?.message || 'Login failed')
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <p className="heading-sm text-accent">{SITE_NAME}</p>
        <h1 className="display-md">Admin sign in</h1>
    

        <form className="admin-form-stack" onSubmit={onSubmit}>
          <InputGroup label="Email or phone" htmlFor="adminIdentifier" required>
            <Input
              id="adminIdentifier"
              type="text"
              inputMode="email"
              autoComplete="username"
              placeholder="Email or 10-digit phone"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </InputGroup>
          <InputGroup label="Password" htmlFor="adminPassword" required>
            <Input
              id="adminPassword"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </InputGroup>
          <Button type="submit" variant="primary" fullWidth disabled={login.isPending}>
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="body-sm text-muted admin-login__back">
          <Link to="/">← Back to store</Link>
        </p>
      </div>
    </div>
  )
}
