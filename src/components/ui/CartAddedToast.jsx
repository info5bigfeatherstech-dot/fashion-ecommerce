import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'

export function CartAddedToast({ id, product, quantity = 1, onViewBag }) {
  const lineTotal = product.price * quantity
  const description =
    quantity > 1
      ? `${product.name} × ${quantity} · ${formatPrice(lineTotal)}`
      : `${product.name} · ${formatPrice(lineTotal)}`

  const handleViewBag = () => {
    toast.dismiss(id)
    onViewBag?.()
  }

  return (
    <div className="cart-toast" role="status" aria-live="polite">
      <button
        type="button"
        className="cart-toast__dismiss"
        onClick={() => toast.dismiss(id)}
        aria-label="Dismiss notification"
      >
        <X size={14} strokeWidth={2} />
      </button>

      <span className="cart-toast__icon" aria-hidden="true">
        <Check size={15} strokeWidth={2.5} />
      </span>

      <div className="cart-toast__body">
        <p className="cart-toast__title">Added to bag</p>
        <p className="cart-toast__desc">{description}</p>
      </div>

      {onViewBag ? (
        <button type="button" className="cart-toast__action" onClick={handleViewBag}>
          View bag
        </button>
      ) : null}

      <span className="cart-toast__progress" aria-hidden="true" />
    </div>
  )
}
