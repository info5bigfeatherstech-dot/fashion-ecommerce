import { useMemo } from 'react'
import { Mail, Phone, ShieldCheck } from 'lucide-react'

function WhatsAppIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.628 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

const SUPPORT_OPTIONS = [
  {
    id: 'whatsapp',
    title: 'WhatsApp Support',
    detail: '+91 8690720398',
    actionText: 'Chat Now',
    href: 'https://wa.me/918690720398?text=Hello%20BigFeatherTechnology%2C%20I%20need%20assistance%20with%20my%20dashboard.',
    tone: 'whatsapp',
    Icon: WhatsAppIcon,
  },
  {
    id: 'email',
    title: 'Email Inquiry',
    detail: 'feathers.big@gmail.com',
    actionText: 'Send Email',
    href: 'mailto:feathers.big@gmail.com',
    tone: 'email',
    Icon: Mail,
  },
  {
    id: 'phone',
    title: 'Phone Support',
    detail: '+91 8690720398',
    actionText: 'Call Now',
    href: 'tel:+918690720398',
    tone: 'phone',
    Icon: Phone,
  },
]

function useSupportLiveStatus() {
  return useMemo(() => {
    const now = new Date()
    const day = now.getDay()
    const hour = now.getHours()
    return day >= 1 && day <= 6 && hour >= 9 && hour < 18
  }, [])
}

export default function AdminSupportPage() {
  const isLive = useSupportLiveStatus()

  return (
    <div className="admin-page admin-support">
      <h1 className="admin-support__title">Support</h1>

      <section className="admin-support__hero">
        <div className="admin-support__hero-top">
          <div>
            <h2 className="admin-support__hero-title">Help &amp; Support</h2>
            <p className="admin-support__hero-sub">
              Our technical team at BigFeatherTechnology is here to assist with your business operations.
            </p>
          </div>
          <span className={`admin-support__live-badge${isLive ? ' is-live' : ''}`}>
            <span className="admin-support__live-dot" aria-hidden />
            {isLive ? 'Live Support Active' : 'Support Offline'}
          </span>
        </div>

        <div className="admin-support__hero-grid">
          <div>
            <h3 className="admin-support__section-label">Working Hours</h3>
            <div className="admin-support__hours">
              <div className="admin-support__hours-row">
                <span>Monday - Saturday</span>
                <strong>09:00 AM - 06:00 PM</strong>
              </div>
              <div className="admin-support__hours-row">
                <span>Sunday</span>
                <strong className="admin-support__closed">Closed</strong>
              </div>
            </div>
          </div>

          <div className="admin-support__policy">
            <h3 className="admin-support__policy-title">Response Time Policy</h3>
            <p>
              We aim to respond to all technical inquiries within{' '}
              <strong>24 working hours</strong>. For urgent dashboard issues, please use WhatsApp for
              immediate attention.
            </p>
          </div>
        </div>
      </section>

      <div className="admin-support__cards">
        {SUPPORT_OPTIONS.map((option) => {
          const Icon = option.Icon
          return (
            <article key={option.id} className="admin-support__card">
              <div>
                <span className={`admin-support__card-icon admin-support__card-icon--${option.tone}`}>
                  <Icon size={option.tone === 'whatsapp' ? 24 : 22} strokeWidth={2} />
                </span>
                <h4 className="admin-support__card-label">{option.title}</h4>
                <p className="admin-support__card-detail">{option.detail}</p>
              </div>
              <a
                className="admin-support__card-btn"
                href={option.href}
                target={option.id === 'email' ? undefined : '_blank'}
                rel={option.id === 'email' ? undefined : 'noopener noreferrer'}
              >
                {option.actionText}
              </a>
            </article>
          )
        })}
      </div>

      <footer className="admin-support__footer">
        <div className="admin-support__footer-brand">
          <ShieldCheck size={16} aria-hidden />
          <span>BigFeatherTechnology Secure Support Channel</span>
        </div>
        <p className="admin-support__copyright">&copy; {new Date().getFullYear()} All Rights Reserved</p>
      </footer>
    </div>
  )
}
