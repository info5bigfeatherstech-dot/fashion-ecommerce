import desktopLogo from '@/assets/FabUniqo- Fashion Uniquely yours.png'
import mobileLogo from '@/assets/FabUniqo-logo-install.png'
import { SITE_NAME } from '@/config/site'

export function BrandLogo({ className = '', src }) {
  const classNames = `brand-logo brand-logo--header ${className}`.trim()

  if (src) {
    return (
      <img
        src={src}
        alt={SITE_NAME}
        className={classNames}
      />
    )
  }

  return (
    <picture className="brand-logo-picture">
      <source media="(max-width: 767px)" srcSet={mobileLogo} />
      <img
        src={desktopLogo}
        alt={SITE_NAME}
        className={classNames}
      />
    </picture>
  )
}

export function FooterBrandMark() {
  return <BrandLogo />
}
