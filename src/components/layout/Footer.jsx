import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Mail, Phone } from 'lucide-react'
import { SiFacebook, SiInstagram, SiThreads } from 'react-icons/si'
import { SITE_NAME, SITE_CONTACT, FOOTER_COLUMNS, PAYMENT_METHODS } from '@/config/site'
import { FooterBrandMark } from './BrandLogo'

const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#', Icon: SiInstagram },
  { label: 'Facebook', href: '#', Icon: SiFacebook },
  { label: 'Instagram Threads', href: '#', Icon: SiThreads },
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

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const onChange = (event) => setIsMobile(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return (
    <footer className="footer">
      <div className="container footer__content">
        <div className="footer__brand">
          <Link to="/" className="footer__logo" aria-label={`${SITE_NAME} home`}>
            <FooterBrandMark />
          </Link>
        </div>

        <div className="footer__grid">
          {FOOTER_COLUMNS.map((col) => (
            <FooterSection key={col.title} title={col.title} defaultOpen={!isMobile}>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="footer__link">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </FooterSection>
          ))}
          <FooterSection title="Follow Us" defaultOpen={!isMobile}>
            <div className="footer__social">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a key={label} href={href} className="footer__link footer__social-link" aria-label={label}>
                  <Icon size={26} aria-hidden />
                  <span className="sr-only">{label}</span>
                </a>
              ))}
            </div>
          </FooterSection>
          <FooterSection title="Contact" defaultOpen={!isMobile}>
            <div className="footer__contact">
              <a href={SITE_CONTACT.emailHref} className="footer__contact-link">
                <Mail size={16} aria-hidden="true" />
                {SITE_CONTACT.email}
              </a>
              <a href={SITE_CONTACT.phoneHref} className="footer__contact-link">
                <Phone size={16} aria-hidden="true" />
                {SITE_CONTACT.phone}
              </a>
            </div>
          </FooterSection>
        </div>

        <div className="footer__bottom">
          <p className="body-sm" style={{ color: 'var(--color-neutral)' }}>
            © {new Date().getFullYear()} {SITE_NAME}. All Rights Reserved.
          </p>
          {/* <div className="footer__payments">
            {PAYMENT_METHODS.map((method) => (
              <span key={method} className="footer__payment-icon">{method}</span>
            ))}
          </div> */}
        </div>
      </div>
    </footer>
  )
}
