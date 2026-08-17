import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store'
import { formatPrice } from '@/lib/utils'

export function CartItem({ item, showLink = true }) {
  const updateQuantity = useAppStore((s) => s.updateQuantity)
  const removeItem = useAppStore((s) => s.removeItem)

  const content = (
    <>
      <img src={item.image} alt={item.name} className="cart-item__image" />
      <div className="cart-item__details">
        {showLink ? (
          <Link to={`/product/${item.slug}`} className="cart-item__name">{item.name}</Link>
        ) : (
          <p className="cart-item__name">{item.name}</p>
        )}
        <p className="cart-item__meta">
          {item.size && `Size: ${item.size}`}
          {item.size && item.color && ' · '}
          {item.color && `Color: ${item.color}`}
        </p>
        <p className="cart-item__price">{formatPrice(item.price * item.quantity)}</p>
        <div className="cart-item__actions">
          <button
            className="qty-btn"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            aria-label="Decrease quantity"
            disabled={item.quantity <= 1}
          >
            −
          </button>
          <span className="body-sm">{item.quantity}</span>
          <button
            className="qty-btn"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => removeItem(item.id)}
            aria-label="Remove item"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </>
  )

  return <div className="cart-item">{content}</div>
}
