/**
 * Renders Wt / dims / Vol segments with bold Wt & Vol labels.
 * @param {{ segments?: Array<{ label?: string|null, value: string }>, className?: string, as?: 'p' | 'span' }} props
 */
export function ShippingWeightMetaText({ segments, className, as: Tag = 'p' }) {
  if (!Array.isArray(segments) || segments.length === 0) return null

  return (
    <Tag className={className}>
      {segments.map((seg, i) => (
        <span key={`${seg.label || 'x'}-${seg.value}-${i}`} className="od-ship-meta__part">
          {i > 0 ? (
            <span className="od-ship-meta__dot" aria-hidden>
              {' '}
              ·{' '}
            </span>
          ) : null}
          {seg.label ? <strong className="od-ship-meta__label">{seg.label}</strong> : null}
          {seg.label ? ' ' : null}
          <span className="od-ship-meta__value">{seg.value}</span>
        </span>
      ))}
    </Tag>
  )
}

export default ShippingWeightMetaText
