import logo from '@/assets/logo1.png'
import { SITE_NAME } from '@/config/site'

export function BrandLogo({ className = '', variant = 'default' }) {
  const variantClass = variant === 'footer' ? 'brand-logo--footer' : ''

  return (
    <img
      src={logo}
      alt={SITE_NAME}
      className={`brand-logo ${variantClass} ${className}`.trim()}
    />
  )
}

export function FooterBrandMark() {
  return (
    <div className="footer-brand-mark">
      <BrandLogo variant="footer" />
    </div>
  )
}
