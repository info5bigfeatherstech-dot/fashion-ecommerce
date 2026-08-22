import { AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function PaymentErrorOverlay({ error, orderId, onRetry, onClose }) {
  return (
    <div className="payment-overlay" role="alertdialog" aria-labelledby="payment-error-title">
      <div className="payment-overlay__card payment-overlay__card--error">
        <div className="payment-overlay__icon payment-overlay__icon--error" aria-hidden="true">
          <AlertCircle size={28} />
        </div>
        <h3 id="payment-error-title" className="payment-overlay__title">Payment failed</h3>
        <p className="body-sm text-muted payment-overlay__message">
          {error || 'Something went wrong with your payment. Please try again.'}
        </p>
        <div className="payment-overlay__actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {orderId ? (
            <Button type="button" variant="primary" asChild>
              <Link to="/account" state={{ openOrderId: orderId }} onClick={onClose}>
                View order
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
