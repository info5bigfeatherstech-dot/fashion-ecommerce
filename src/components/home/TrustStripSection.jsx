import { Globe, RefreshCw, Shield, BadgeCheck } from 'lucide-react'
import { TRUST_ITEMS } from '@/config/site'

const ICONS = [Globe, RefreshCw, Shield, BadgeCheck]

export function TrustStripSection() {
  return (
    <section className="section container">
      <div className="section-header">
        <div>
          <h2 className="display-md">Shop with <span className="heading-accent">Confidence</span></h2>
          <p className="section-subheader">
            Quality pieces, easy returns, and secure checkout — so every order feels effortless.
          </p>
        </div>
      </div>
      <div className="trust-strip">
        {TRUST_ITEMS.map((item, i) => {
          const Icon = ICONS[i]
          return (
            <div key={item.title} className="trust-strip__item">
              <Icon size={24} className="trust-strip__icon" />
              <p className="trust-strip__title">{item.title}</p>
              <p className="trust-strip__desc">{item.description}</p>
            </div>
          )
        })}
      </div>
      <p className="section-footnote">
        From first click to delivery, we keep the experience simple, secure, and jewelry-ready.
      </p>
    </section>
  )
}
