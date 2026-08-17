import { Globe, RefreshCw, Shield, BadgeCheck } from 'lucide-react'
import { TRUST_ITEMS } from '@/config/site'

const ICONS = [Globe, RefreshCw, Shield, BadgeCheck]

export function TrustStripSection() {
  return (
    <section className="container">
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
    </section>
  )
}
