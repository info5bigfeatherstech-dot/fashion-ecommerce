import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store'
import { cn, formatPrice } from '@/lib/utils'

export function CartItem({ item, showLink = true, layout = 'drawer' }) {
  const updateQuantity = useAppStore((s) => s.updateQuantity)
  const removeItem = useAppStore((s) => s.removeItem)
  const lineTotal = item.price * item.quantity

  const name = showLink ? (
    <Link to={`/product/${item.slug}`} className="cart-item__name">
      {item.name}
    </Link>
  ) : (
    <p className="cart-item__name">{item.name}</p>
  )

  return (
    <article className={cn('cart-item', layout === 'page' && 'cart-item--page')}>
      <div className="cart-item__media">
        <img src={item.image} alt={item.name} className="cart-item__image" />
      </div>

      <div className="cart-item__details">
        <div className="cart-item__copy">
          {name}
          {(item.size || item.color) && (
            <p className="cart-item__meta">
              {item.size && `Size: ${item.size}`}
              {item.size && item.color && ' · '}
              {item.color && `Color: ${item.color}`}
            </p>
          )}
          <p className="cart-item__unit">{formatPrice(item.price)} each</p>
        </div>

        <div className="cart-item__controls">
          <div className="qty-stepper cart-item__qty" role="group" aria-label="Quantity">
            <button
              type="button"
              className="qty-stepper__btn"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              aria-label="Decrease quantity"
              disabled={item.quantity <= 1}
            >
              <Minus size={14} />
            </button>
            <span className="qty-stepper__value" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              className="qty-stepper__btn"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            type="button"
            className="cart-item__remove"
            onClick={() => removeItem(item.id)}
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 size={15} />
            <span>Remove</span>
          </button>
        </div>
      </div>

      <p className="cart-item__price">{formatPrice(lineTotal)}</p>
    </article>
  )
}
