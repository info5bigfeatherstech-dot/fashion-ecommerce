import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { JEWELRY_ARCHIVE } from '@/config/site'

const DEFAULT_YEAR = 2024

export function TheArchiveSection() {
  const [activeYear, setActiveYear] = useState(DEFAULT_YEAR)
  const entry = JEWELRY_ARCHIVE.find((item) => item.year === activeYear) || JEWELRY_ARCHIVE[0]
  const yearShort = String(entry.year).slice(-2)

  return (
    <section className="section container jewelry-archive" aria-label="Jewelry archive">
      <h2 className="jewelry-archive__heading">
        Jewelry <em>Archive</em>
      </h2>

      <div className="jewelry-archive__layout">
        <div className="jewelry-archive__media">
          <AnimatePresence mode="wait">
            <motion.div
              key={entry.year}
              className="jewelry-archive__frame"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <img src={entry.image} alt={entry.alt} className="jewelry-archive__image" loading="lazy" />
              <div className="jewelry-archive__tag">
                <p className="jewelry-archive__tag-eyebrow">{entry.tagEyebrow}</p>
                <p className="jewelry-archive__tag-name">{entry.tagName}</p>
                <p className="jewelry-archive__tag-price">{entry.tagPrice}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="jewelry-archive__copy">
          <p className="jewelry-archive__watermark" aria-hidden="true">
            {yearShort}
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={`copy-${entry.year}`}
              className="jewelry-archive__copy-inner"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <h3 className="jewelry-archive__title">{entry.title}</h3>
              <p className="jewelry-archive__description">{entry.description}</p>
              <Link to={entry.href} className="jewelry-archive__cta">
                Explore Collection
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </motion.div>
          </AnimatePresence>

          <div className="jewelry-archive__timeline" role="tablist" aria-label="Archive years">
            <div className="jewelry-archive__timeline-track" aria-hidden="true" />
            {JEWELRY_ARCHIVE.map((item) => {
              const isActive = item.year === activeYear
              return (
                <button
                  key={item.year}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`jewelry-archive__year${isActive ? ' is-active' : ''}`}
                  onClick={() => setActiveYear(item.year)}
                >
                  <span className="jewelry-archive__year-tick" aria-hidden="true" />
                  <span className="jewelry-archive__year-label">{item.year}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
