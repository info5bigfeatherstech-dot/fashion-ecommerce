import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Scanner from '@/components/effects/Scanner'
import { SITE_NAME, FOOTER_COLUMNS, PAYMENT_METHODS } from '@/config/site'
import { FooterBrandMark } from './BrandLogo'

function SocialIcon({ type, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }
  const stroke = 'currentColor'

  if (type === 'facebook') {
    return (
      <svg {...common}>
        <path d="M14 9H17V6H14C12.3431 6 11 7.34315 11 9V11H9V14H11V18H14V14H16L17 11H14V9Z" fill={stroke} />
      </svg>
    )
  }

  if (type === 'instagram') {
    return (
      <svg {...common}>
        <path
          d="M7.5 3.5H16.5C18.7091 3.5 20.5 5.29086 20.5 7.5V16.5C20.5 18.7091 18.7091 20.5 16.5 20.5H7.5C5.29086 20.5 3.5 18.7091 3.5 16.5V7.5C3.5 5.29086 5.29086 3.5 7.5 3.5Z"
          stroke={stroke}
          strokeWidth="1.8"
        />
        <path d="M12 16.2C14.3196 16.2 16.2 14.3196 16.2 12C16.2 9.68041 14.3196 7.8 12 7.8C9.68041 7.8 7.8 9.68041 7.8 12C7.8 14.3196 9.68041 16.2 12 16.2Z" stroke={stroke} strokeWidth="1.8" />
        <path d="M17.3 6.8H17.31" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    )
  }

  // Threads (stylized "@" mark)
  return (
    <svg {...common}>
      <path
        d="M12 21c5 0 9-4 9-9s-4-9-9-9-9 4-9 9 4 9 9 9Z"
        stroke={stroke}
        strokeWidth="1.8"
      />
      <path
        d="M9.8 12.3c0-2 1.2-3.3 3-3.3 1.6 0 2.7 1 2.7 2.6 0 1.3-.7 2-1.6 2-.7 0-1-.4-1-1.1v-1.9"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 10.4l1.7-.8" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#', type: 'instagram' },
  { label: 'Facebook', href: '#', type: 'facebook' },
  { label: 'Instagram Threads', href: '#', type: 'threads' },
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
      {!reduceMotion && (
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
      )}

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
              {SOCIAL_LINKS.map((social) => (
                <a key={social.label} href={social.href} className="footer__link" aria-label={social.label}>
                  <SocialIcon type={social.type} size={18} />
                  <span className="sr-only">{social.label}</span>
                </a>
              ))}
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
