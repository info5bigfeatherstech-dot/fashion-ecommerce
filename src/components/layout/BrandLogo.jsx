import headerLogo from '@/assets/FabUniqo- Fashion Uniquely yours.png'
import { SITE_NAME } from '@/config/site'

export function BrandLogo({ className = '' }) {
  return (
    <img
      src={headerLogo}
      alt={SITE_NAME}
      className={`brand-logo brand-logo--header ${className}`.trim()}
    />
  )
}

export function FooterBrandMark() {
  return <BrandLogo />
}
