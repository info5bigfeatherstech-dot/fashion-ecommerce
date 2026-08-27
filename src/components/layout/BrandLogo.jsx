import headerLogo from '@/assets/FabUniqo- Fashion Uniquely yours.png'
import { SITE_NAME } from '@/config/site'

export function BrandLogo({ className = '', variant = 'default' }) {
  const variantClass = variant === 'footer' ? 'brand-logo--footer' : 'brand-logo--header'

  return (
    <img
      src={headerLogo}
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
