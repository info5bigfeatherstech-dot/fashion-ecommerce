import { Loader2 } from 'lucide-react'

export function PaymentLoadingOverlay({ message }) {
  return (
    <div className="payment-overlay" role="status" aria-live="polite">
      <div className="payment-overlay__card">
        <Loader2 size={32} className="payment-overlay__spinner" aria-hidden="true" />
        <p className="payment-overlay__title">{message || 'Processing payment…'}</p>
        <p className="body-sm text-muted">Please do not close this window</p>
      </div>
    </div>
  )
}
