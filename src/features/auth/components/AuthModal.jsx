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
      className="modal-content--auth"
      overlayClassName="modal-overlay--black"
    >
      <div className="auth-modal">
        <AuthForms
          mode={formMode}
          onModeChange={(mode) => setFormMode(mode === 'register' ? 'register' : 'login')}
          onAuthenticated={handleAuthenticated}
          error={authError}
          setError={setAuthError}
        />
      </div>
    </Modal>
  )
}
