import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { SiFacebook, SiInstagram } from 'react-icons/si'
import { SITE_NAME, SITE_CONTACT, FOOTER_COLUMNS } from '@/config/site'
import { useFooterShopLinks } from '@/features/category/hooks'
import { FooterBrandMark } from './BrandLogo'

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/fabuniqo?igsi=MXFwZHdpcmF4bWV0ag==', Icon: SiInstagram },
  { label: 'Facebook', href: 'https://www.facebook.com/share/1PYm15KDNA/', Icon: SiFacebook },
]

function FooterSection({ title, children, defaultOpen = false }) {
  return (
    <details className="footer__accordion" open={defaultOpen || undefined}>
      <summary className="footer__column-title footer__accordion-trigger">{title}</summary>
      <div className="footer__accordion-body">{children}</div>
    </details>
  )
}

export function Footer() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  )
  const { links: shopLinks } = useFooterShopLinks()

  const columns = useMemo(() => {
    const shopColumn = shopLinks.length
      ? [{ title: 'Shop', links: shopLinks }]
      : []
    return [...shopColumn, ...FOOTER_COLUMNS]
  }, [shopLinks])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const onChange = (event) => setIsMobile(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return (
    <footer className="footer">
      <div className="footer__brand-bar">
        <div className="container footer__brand-bar-inner">
          <Link to="/" className="footer__logo" aria-label={`${SITE_NAME} home`}>
            <FooterBrandMark />
          </Link>
        </div>
      </div>

      <div className="container footer__content">
        <div className="footer__grid">
          {columns.map((col) => (
            <FooterSection key={col.title} title={col.title} defaultOpen={!isMobile}>
              <ul>
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.href}-${link.label}`}>
                    <Link to={link.href} className="footer__link">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </FooterSection>
          ))}
          <FooterSection title="Follow Us" defaultOpen={!isMobile}>
            <div className="footer__social">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a key={label} href={href} className="footer__link footer__social-link" aria-label={label} target="_blank" rel="noopener noreferrer">
                  <Icon size={26} aria-hidden />
                  <span className="sr-only">{label}</span>
                </a>
              ))}
            </div>
          </FooterSection>
          <FooterSection title="Customer Support" defaultOpen={!isMobile}>
            <div className="footer__contact">
              <a href={SITE_CONTACT.emailHref} className="footer__contact-link">
                <Mail size={16} aria-hidden="true" />
                {SITE_CONTACT.email}
              </a>
            </div>
          </FooterSection>
        </div>

        <div className="footer__bottom">
          <p className="body-sm" style={{ color: 'var(--color-neutral)' }}>
            © {new Date().getFullYear()} {SITE_NAME}. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
