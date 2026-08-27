import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'

export default function Register() {
  const location = useLocation()
  const navigate = useNavigate()
  const openAuthModal = useAppStore((s) => s.openAuthModal)

  useEffect(() => {
    openAuthModal({
      redirectTo: location.state?.redirectTo || '/account/profile',
      mode: 'register',
    })
    navigate(location.state?.from || '/', { replace: true })
  }, [location.state, navigate, openAuthModal])

  return null
}
