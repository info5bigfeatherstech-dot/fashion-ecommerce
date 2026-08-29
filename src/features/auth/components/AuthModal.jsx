import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { AuthForms } from '@/features/auth/components/AuthForms'
import { useAppStore } from '@/store'

export function AuthModal() {
  const navigate = useNavigate()
  const authModalOpen = useAppStore((s) => s.authModalOpen)
  const authModalMode = useAppStore((s) => s.authModalMode)
  const authRedirectTo = useAppStore((s) => s.authRedirectTo)
  const closeAuthModal = useAppStore((s) => s.closeAuthModal)
  const setSession = useAppStore((s) => s.setSession)

  const [formMode, setFormMode] = useState('login')
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (authModalOpen) {
      setFormMode(authModalMode === 'register' ? 'register' : 'login')
      setAuthError('')
    }
  }, [authModalOpen, authModalMode])

  const isRegisterLayout = formMode === 'register'

  const handleAuthenticated = (session) => {
    if (session?.user) {
      setSession({
        user: session.user,
        accessToken: session.accessToken || useAppStore.getState().accessToken,
      })
    }
    setAuthError('')
    closeAuthModal()
    navigate(authRedirectTo || '/account/profile', { replace: true })
  }

  const handleOpenChange = (open) => {
    if (!open) {
      closeAuthModal()
      setAuthError('')
    }
  }

  return (
    <Modal
      open={authModalOpen}
      onOpenChange={handleOpenChange}
      title={formMode === 'register' ? 'Create Account' : 'Sign In'}
      className={isRegisterLayout ? 'modal-content--auth modal-content--auth-register' : 'modal-content--auth'}
      overlayClassName="modal-overlay--black"
    >
      <div className={isRegisterLayout ? 'auth-modal auth-modal--register' : 'auth-modal'}>
        {isRegisterLayout ? (
          <>
            <div className="auth-modal__register-hero" aria-hidden="true">
              <div className="auth-modal__register-hero-inner">
                <h3
                  className="auth-modal__register-title"
                  style={{ marginBottom: '2px', fontFamily: 'var(--font-italic-serif)', fontSize: '1.25rem' }}
                >
                  Join the Fashion circle
                </h3>
                <p className="auth-modal__register-subtitle" style={{ fontSize: '0.82rem', margin: 0 }}>
                  Get early access to drops, save your wishlist, and check out faster.
                </p>
              </div>
            </div>

            <div className="auth-modal__register-body">
              <AuthForms
                mode="register"
                onModeChange={(mode) => setFormMode(mode === 'register' ? 'register' : 'login')}
                onAuthenticated={handleAuthenticated}
                error={authError}
                setError={setAuthError}
              />
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
              mode="login"
              onModeChange={(mode) => setFormMode(mode === 'register' ? 'register' : 'login')}
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
