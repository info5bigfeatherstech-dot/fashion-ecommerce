import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Share2 } from 'lucide-react'
import Scanner from '@/components/effects/Scanner'
import { SITE_NAME, FOOTER_COLUMNS, PAYMENT_METHODS } from '@/config/site'

const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#' },
  { label: 'Facebook', href: '#' },
  { label: 'X', href: '#' },
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
                  <Share2 size={18} />
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
