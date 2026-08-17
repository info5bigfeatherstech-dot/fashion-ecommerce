import { useState } from 'react'
import { PRODUCT_OFFER } from '@/config/site'

export function OfferCode({ compact = false }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(PRODUCT_OFFER.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  if (compact) {
    return (
      <p className="offer-code offer-code--compact">
        {PRODUCT_OFFER.label} <span className="offer-code__value">{PRODUCT_OFFER.code}</span>
      </p>
    )
  }

  return (
    <div className="offer-code">
      <span className="offer-code__label">{PRODUCT_OFFER.label}</span>
      <button type="button" className="offer-code__pill" onClick={handleCopy}>
        {copied ? 'Copied' : PRODUCT_OFFER.code}
      </button>
      <span className="offer-code__detail">{PRODUCT_OFFER.detail}</span>
    </div>
  )
}
