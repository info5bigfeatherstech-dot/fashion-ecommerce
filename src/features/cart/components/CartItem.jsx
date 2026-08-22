import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store'
import { cn, formatPrice } from '@/lib/utils'

export function CartItem({ item, showLink = true, layout = 'drawer' }) {
  const updateQuantity = useAppStore((s) => s.updateQuantity)
  const removeItem = useAppStore((s) => s.removeItem)
  const lineTotal = item.price * item.quantity
  const productCode = item.productCode || null
  const isAccount = layout === 'account'
  const isPage = layout === 'page' || isAccount

  const name = showLink ? (
    <Link to={`/product/${item.slug}`} className="cart-item__name">
      {item.name}
    </Link>
  ) : (
    <p className="cart-item__name">{item.name}</p>
  )

  return (
    <article
      className={cn(
        'cart-item',
        isPage && 'cart-item--page',
        isAccount && 'cart-item--account',
      )}
    >
      <Link to={`/product/${item.slug}`} className="cart-item__media" tabIndex={-1} aria-hidden="true">
        <img src={item.image} alt="" className="cart-item__image" />
      </Link>

      <div className="cart-item__details">
        <div className="cart-item__copy">
          {name}

          <div className="cart-item__tags">
            {productCode && <span className="cart-item__tag">{productCode}</span>}
            {item.size && <span className="cart-item__tag">Size {item.size}</span>}
            {item.color && <span className="cart-item__tag">{item.color}</span>}
          </div>

          <p className="cart-item__unit">{formatPrice(item.price)} each</p>
        </div>

        <div className="cart-item__controls">
          <div className="qty-stepper cart-item__qty" role="group" aria-label="Quantity">
            <button
              type="button"
              className="qty-stepper__btn"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              aria-label="Decrease quantity"
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

      <div className="cart-item__aside">
        <p className="cart-item__price">{formatPrice(lineTotal)}</p>
        {item.quantity > 1 && (
          <p className="cart-item__qty-note">{item.quantity} × {formatPrice(item.price)}</p>
        )}
      </div>
    </article>
  )
}
