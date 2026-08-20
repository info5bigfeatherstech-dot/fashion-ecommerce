import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Gem, ShieldCheck, ZoomIn } from 'lucide-react'
import { CRAFTSMANSHIP_INSPECTION } from '@/config/site'

const LENS_SIZE = 180
const ZOOM_LEVEL = 2.4

function CraftImageZoom({ src, alt }) {
  const frameRef = useRef(null)
  const [zooming, setZooming] = useState(false)
  const [lens, setLens] = useState({ x: 0, y: 0, bgX: 0, bgY: 0, bgW: 0, bgH: 0 })

  const handleMove = (event) => {
    const el = frameRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setLens({
      x: x - LENS_SIZE / 2,
      y: y - LENS_SIZE / 2,
      bgX: -(x * ZOOM_LEVEL - LENS_SIZE / 2),
      bgY: -(y * ZOOM_LEVEL - LENS_SIZE / 2),
      bgW: rect.width * ZOOM_LEVEL,
      bgH: rect.height * ZOOM_LEVEL,
    })
  }

  return (
    <div
      ref={frameRef}
      className={`craft-inspect__zoom${zooming ? ' is-zooming' : ''}`}
      onMouseEnter={() => setZooming(true)}
      onMouseLeave={() => setZooming(false)}
      onMouseMove={handleMove}
      role="img"
      aria-label={`${alt}. Hover to zoom with magnifier.`}
    >
      <img src={src} alt={alt} className="craft-inspect__image" loading="lazy" />

      {zooming && (
        <div
          className="craft-inspect__loupe"
          style={{
            width: LENS_SIZE,
            height: LENS_SIZE,
            transform: `translate(${lens.x}px, ${lens.y}px)`,
            backgroundImage: `url(${src})`,
            backgroundSize: `${lens.bgW}px ${lens.bgH}px`,
            backgroundPosition: `${lens.bgX}px ${lens.bgY}px`,
          }}
          aria-hidden="true"
        />
      )}

      <span className="craft-inspect__zoom-hint" aria-hidden="true">
        <ZoomIn size={16} />
        Zoom
      </span>
    </div>
  )
}

function SpecIcon({ type }) {
  if (type === 'shield') return <ShieldCheck size={16} aria-hidden="true" />
  return <Gem size={16} aria-hidden="true" />
}

export function CraftsmanshipSection() {
  const data = CRAFTSMANSHIP_INSPECTION

  return (
    <section className="section container craft-inspect" aria-label="Craftsmanship inspection">
      <div className="craft-inspect__layout">
        <div className="craft-inspect__media">
          <CraftImageZoom src={data.image} alt={data.alt} />
        </div>

        <div className="craft-inspect__copy">
          <p className="craft-inspect__eyebrow">
            <span className="craft-inspect__eyebrow-rule" aria-hidden="true" />
            {data.eyebrow}
          </p>

          <h2 className="craft-inspect__brand-title">
            <span className="craft-inspect__brand-lead">{data.titleLead}</span>
            {' '}
            <span className="craft-inspect__brand-amp">{data.titleAmp}</span>
            {' '}
            <span className="craft-inspect__brand-trail">{data.titleTrail}</span>
          </h2>

          <h3 className="craft-inspect__heading">{data.heading}</h3>
          <p className="craft-inspect__body">{data.body}</p>

          <div className="craft-inspect__specs">
            {data.specs.map((spec) => (
              <div key={spec.id} className="craft-inspect__spec">
                <p className="craft-inspect__spec-label">
                  <SpecIcon type={spec.icon} />
                  {spec.label}
                </p>
                <p className="craft-inspect__spec-value">{spec.value}</p>
                <p className="craft-inspect__spec-detail">{spec.detail}</p>
              </div>
            ))}
          </div>

          <Link to={data.ctaHref} className="craft-inspect__cta">
            {data.ctaLabel}
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
