import { Link } from 'react-router-dom'
import { ScrollRevealText } from '@/components/motion/ScrollRevealText'
import { SIGNATURE_JEWELRY } from '@/config/site'

export function SignatureJewelrySection() {
  const {
    eyebrow,
    titleLine1,
    titleLine2,
    ctaLabel,
    ctaHref,
    note,
    badge,
    watermark,
    image,
    alt,
  } = SIGNATURE_JEWELRY

  return (
    <section className="signature-jewelry" aria-label="Signature jewelry">
      <div className="container">
        <div className="signature-jewelry__inner">
          <p className="signature-jewelry__watermark" aria-hidden="true">
            {watermark}
          </p>

          <div className="signature-jewelry__content">
            <div className="signature-jewelry__copy">
              <p className="signature-jewelry__eyebrow">
                <span className="signature-jewelry__eyebrow-rule" aria-hidden="true" />
                {eyebrow}
              </p>

              <ScrollRevealText as="h2" className="signature-jewelry__title">
                <span className="signature-jewelry__title-line">{titleLine1}</span>
                <span className="signature-jewelry__title-accent">{titleLine2}</span>
              </ScrollRevealText>

              <div className="signature-jewelry__actions">
                <Link to={ctaHref} className="signature-jewelry__cta">
                  <span className="signature-jewelry__cta-label">{ctaLabel}</span>
                  <span className="signature-jewelry__cta-icon" aria-hidden="true">
                    →
                  </span>
                </Link>
                <p className="signature-jewelry__note">{note}</p>
              </div>
            </div>

            <div className="signature-jewelry__media">
              <div className="signature-jewelry__frame">
                <img src={image} alt={alt} loading="lazy" />
              </div>
            </div>
          </div>

          <p className="signature-jewelry__badge">{badge}</p>
        </div>
      </div>
    </section>
  )
}
