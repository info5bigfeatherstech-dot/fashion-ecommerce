import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import { SiFacebook, SiInstagram, SiThreads } from 'react-icons/si'
import Scanner from '@/components/effects/Scanner'
import { SITE_NAME, SITE_CONTACT, FOOTER_COLUMNS, PAYMENT_METHODS } from '@/config/site'
import { FooterBrandMark } from './BrandLogo'

const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#', Icon: SiInstagram },
  { label: 'Facebook', href: '#', Icon: SiFacebook },
  { label: 'Instagram Threads', href: '#', Icon: SiThreads },
]

export function Footer() {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(media.matches)
    const onChange = (event) => setReduceMotion(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return (
    <footer className="footer">
      {/* {!reduceMotion && (
        <div className="footer__scanner" aria-hidden="true">
          <Scanner
            color1="#14120F"
            color2="#E0396A"
            color3="#FAF7F2"
            speed={0.35}
            sweepSpeed={0.18}
            sweepWidth={1.8}
            sweepFalloff={7}
            scale={1.4}
            frequency={1.6}
            ripple={0.18}
            bandDensity={9}
            lineSharpness={5}
            glow={0.28}
            scanDirection="horizontal"
            colorSpread={0.45}
            brightness={0.85}
            contrast={1.1}
            softness={1.6}
            vignette={0.55}
            scanline={true}
            grain={true}
            grainIntensity={0.04}
            opacity={0.55}
            mouseInteraction={false}
          />
        </div>
      )} */}

      <div className="container footer__content">
        <div className="footer__brand">
          <Link to="/" className="footer__logo" aria-label={`${SITE_NAME} home`}>
            <FooterBrandMark />
          </Link>
        </div>

        <div className="footer__grid">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="footer__column-title">{col.title}</h3>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="footer__link">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="footer__column-title">Follow Us</h3>
            <div className="footer__social">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a key={label} href={href} className="footer__link footer__social-link" aria-label={label}>
                  <Icon size={26} aria-hidden />
                  <span className="sr-only">{label}</span>
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="footer__column-title">Contact</h3>
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
          </div>
        </div>

        <div className="footer__bottom">
          <p className="body-sm" style={{ color: 'var(--color-neutral)' }}>
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved. Every product designed and owned by us.
          </p>
          <div className="footer__payments">
            {PAYMENT_METHODS.map((method) => (
              <span key={method} className="footer__payment-icon">{method}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
