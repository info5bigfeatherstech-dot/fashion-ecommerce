import { Check, X, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'

export function CartAddedToast({ id, product, quantity = 1, onViewBag }) {
  const lineTotal = (product?.price || 0) * quantity
  const productImage = product?.image || product?.images?.[0] || product?.thumbnail || ''

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
        <X size={15} strokeWidth={2.2} />
      </button>

      <div className="cart-toast__media">
        {productImage ? (
          <div className="cart-toast__thumb-wrap">
            <img
              src={productImage}
              alt=""
              className="cart-toast__img"
              referrerPolicy="no-referrer"
            />
            <span className="cart-toast__badge-check" aria-hidden="true">
              <Check size={11} strokeWidth={3} />
            </span>
          </div>
        ) : (
          <span className="cart-toast__icon" aria-hidden="true">
            <Check size={18} strokeWidth={2.6} />
          </span>
        )}
      </div>

      <div className="cart-toast__body">
        <div className="cart-toast__header">
          <p className="cart-toast__title">Added to bag</p>
          {quantity > 1 && (
            <span className="cart-toast__qty-tag">Qty: {quantity}</span>
          )}
        </div>
        <p className="cart-toast__name">{product?.name}</p>
        <p className="cart-toast__price">{formatPrice(lineTotal)}</p>
      </div>

      {onViewBag ? (
        <button type="button" className="cart-toast__action" onClick={handleViewBag}>
          <span>View bag</span>
          <ArrowRight size={13} strokeWidth={2.2} />
        </button>
      ) : null}

      <span className="cart-toast__progress" aria-hidden="true" />
    </div>
  )
}
