import logo from '@/assets/logo1.png'
import { SITE_NAME } from '@/config/site'

export function BrandLogo({ className = '' }) {
  return (
    <img
      src={logo}
      alt={SITE_NAME}
      className={`brand-logo ${className}`.trim()}
    />
  )
}
