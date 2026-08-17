import { Link } from 'react-router-dom'
import { Share2 } from 'lucide-react'
import { SITE_NAME, FOOTER_COLUMNS, PAYMENT_METHODS } from '@/config/site'

const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#' },
  { label: 'Facebook', href: '#' },
  { label: 'X', href: '#' },
]

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
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
