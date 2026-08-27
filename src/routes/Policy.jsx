import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, Navigate, useParams, useNavigationType } from 'react-router-dom'
import { policiesData, getPolicyBySlug } from '@/config/policies'
import { SITE_CONTACT } from '@/config/site'
import { Button } from '@/components/ui/Button'

function formatInlineImportant(text) {
  if (text.startsWith('Important:')) {
    return (
      <>
        <strong>Important:</strong>
        {text.slice('Important:'.length)}
      </>
    )
  }
  return text
}

function isStandaloneSubheading(line, nextLine) {
  const t = line.trim()
  if (!t || t.startsWith('•')) return false
  if (!t.endsWith(':')) return false
  if (t.startsWith('Important:')) return false
  if (nextLine && nextLine.trim().startsWith('•')) return true
  if (/^(Refund Rules for RTO Orders|For return\/refund assistance)/.test(t)) return true
  if (t.length < 80 && !/\.\s/.test(t.slice(0, -1))) return true
  return false
}

function renderBulletLabel(raw) {
  const colonIdx = raw.indexOf(':')
  const endsWithColon = colonIdx > 0 && colonIdx === raw.length - 1
  const inlineLabel = colonIdx > 0 && colonIdx < raw.length - 1

  if (endsWithColon) {
    return <strong>{raw}</strong>
  }
  if (inlineLabel) {
    return (
      <>
        <strong>{raw.slice(0, colonIdx + 1)}</strong>
        {raw.slice(colonIdx + 1)}
      </>
    )
  }
  return raw
}

function parseBulletSection(lines, startIdx) {
  const items = []
  let i = startIdx

  while (i < lines.length && lines[i].startsWith('•')) {
    const raw = lines[i].replace(/^•\s*/, '')
    i++

    const bodyParagraphs = []
    while (i < lines.length && !lines[i].startsWith('•')) {
      bodyParagraphs.push(lines[i])
      i++
    }

    let nestedBullets = null
    if (i < lines.length && lines[i].startsWith('•')) {
      const lastBody = bodyParagraphs[bodyParagraphs.length - 1] || ''
      const isNested = raw.endsWith(':') || lastBody.endsWith(':')

      if (isNested) {
        nestedBullets = []
        while (i < lines.length && lines[i].startsWith('•')) {
          nestedBullets.push(lines[i].replace(/^•\s*/, ''))
          i++
        }
      }
    }

    items.push({ raw, bodyParagraphs, nestedBullets })
  }

  const node = (
    <ul key={`bullets-${startIdx}`} className="policy-page__bullets">
      {items.map((item, idx) => (
        <li key={idx} className="policy-page__para">
          {renderBulletLabel(item.raw)}
          {item.bodyParagraphs.map((para, pi) => (
            <p key={pi} className={pi === 0 ? 'policy-page__nested-p' : 'policy-page__nested-p policy-page__nested-p--gap'}>
              {formatInlineImportant(para)}
            </p>
          ))}
          {item.nestedBullets?.length > 0 && (
            <ul className="policy-page__bullets policy-page__bullets--nested">
              {item.nestedBullets.map((nb, ni) => (
                <li key={ni}>{nb}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )

  return { node, consumed: i - startIdx }
}

function PolicyContentBlock({ block, blockIndex }) {
  const lines = block
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const next = lines[i + 1]

    if (line.startsWith('•')) {
      const { node, consumed } = parseBulletSection(lines, i)
      elements.push(node)
      i += consumed
      continue
    }

    if (isStandaloneSubheading(line, next)) {
      elements.push(
        <p key={`${blockIndex}-${i}`} className="policy-page__subheading">
          {line}
        </p>
      )
      i++
      continue
    }

    elements.push(
      <p key={`${blockIndex}-${i}`} className="policy-page__para">
        {formatInlineImportant(line)}
      </p>
    )
    i++
  }

  return <div className="policy-page__block">{elements}</div>
}

function PolicyContent({ content }) {
  const blocks = content.split('\n\n').filter((b) => b.trim())

  return (
    <div className="policy-page__blocks">
      {blocks.map((block, bi) => (
        <PolicyContentBlock key={bi} block={block} blockIndex={bi} />
      ))}
    </div>
  )
}

function PolicySection({ section, index, onVisible }) {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onVisible(index)
      },
      { rootMargin: '-20% 0px -60% 0px' }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [index, onVisible])

  return (
    <section ref={ref} id={`section-${index}`} className="policy-page__section">
      <h2 className="policy-page__section-title">{section.heading}</h2>
      <div className="policy-page__rule" aria-hidden="true" />
      <PolicyContent content={section.content} />
    </section>
  )
}

export default function Policy() {
  const { slug } = useParams()
  const navigationType = useNavigationType()
  const policy = getPolicyBySlug(slug)
  const [activeSection, setActiveSection] = useState(0)
  const onVisible = useCallback((index) => setActiveSection(index), [])

  useEffect(() => {
    setActiveSection(0)
    if (navigationType === 'POP') return
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [slug, navigationType])

  const handleSidebarClick = (index) => {
    const el = document.getElementById(`section-${index}`)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 32
    window.scrollTo({ top, behavior: 'smooth' })
  }

  if (!policy) return <Navigate to="/" replace />

  return (
    <div className="policy-page">
      <header className="policy-page__hero">
        <div className="container policy-page__hero-inner">
          <p className="policy-page__tag">{policy.tag}</p>
          <h1 className="display-lg policy-page__title">{policy.title}</h1>
          {policy.subtitle ? (
            <p className="body-lg text-muted policy-page__subtitle">{policy.subtitle}</p>
          ) : null}
        </div>
      </header>

      <div className="container policy-page__layout">
        <aside className="policy-page__sidebar">
          <nav aria-label="Policy sections">
            <ul className="policy-page__toc">
              {policy.sections.map((section, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className={`policy-page__toc-btn${activeSection === i ? ' is-active' : ''}`}
                    onClick={() => handleSidebarClick(i)}
                  >
                    {section.heading}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="policy-page__other">
            <p className="policy-page__other-label">Other Policies</p>
            <ul>
              {policiesData
                .filter((p) => p.slug !== slug)
                .map((p) => (
                  <li key={p.slug}>
                    <Link to={`/policies/${p.slug}`} className="policy-page__other-link">
                      {p.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </aside>

        <div className="policy-page__content">
          {policy.sections.map((section, i) => (
            <PolicySection
              key={`${slug}-${i}`}
              section={section}
              index={i}
              onVisible={onVisible}
            />
          ))}

          <div className="policy-page__cta card">
            <p className="heading-sm text-accent">Support</p>
            <h3 className="display-md" style={{ fontSize: 'var(--text-2xl)' }}>
              We&apos;re here to help.
            </h3>
            <p className="body-sm text-muted">
              Have questions regarding this policy, your order, or refunds? Our support team is
              available to assist you.
            </p>
            <div className="policy-page__cta-actions">
              <Button asChild variant="accent">
                <Link to="/contact">Contact Us</Link>
              </Button>
              <a href={SITE_CONTACT.emailHref} className="policy-page__cta-email">
                {SITE_CONTACT.email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
