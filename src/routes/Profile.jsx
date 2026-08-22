import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Account from './Account'
import { useAppStore } from '@/store'

export default function Profile() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const openAuthModal = useAppStore((s) => s.openAuthModal)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal({ redirectTo: '/profile', mode: 'login' })
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate, openAuthModal])

  if (!isAuthenticated) {
    return null
  }

  return <Account initialActiveTab="profile" />
}
