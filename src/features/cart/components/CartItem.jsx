import { Minus, Plus, Tag, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store'
import { cn, formatPrice } from '@/lib/utils'

export function CartItem({ item, showLink = true, layout = 'drawer' }) {
  const updateQuantity = useAppStore((s) => s.updateQuantity)
  const removeItem = useAppStore((s) => s.removeItem)
  const lineTotal = (item.price || 0) * (item.quantity || 1)
  const productCode = item.productCode || null
  const isAccount = layout === 'account'
  const isPage = layout === 'page' || isAccount

  const hasItemDiscount = Boolean(
    (item.itemDiscount && item.itemDiscount > 0) ||
      (item.discountedLineTotal != null && item.discountedLineTotal < lineTotal)
  )
  const finalLineTotal = hasItemDiscount
    ? (item.discountedLineTotal ?? Math.max(0, lineTotal - item.itemDiscount))
    : lineTotal
  const savings = hasItemDiscount
    ? (item.itemDiscount ?? Math.max(0, lineTotal - item.discountedLineTotal))
    : 0

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
        hasItemDiscount && 'cart-item--has-coupon'
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

          {item.quantity > 1 && (
            <p className="cart-item__unit">
              {hasItemDiscount ? (
                <>
                  <span className="cart-item__unit-old">{formatPrice(item.price)}</span>{' '}
                  <span className="cart-item__unit-new">
                    {formatPrice(Math.round(finalLineTotal / item.quantity))}
                  </span>{' '}
                  each
                </>
              ) : (
                `${formatPrice(item.price)} each`
              )}
            </p>
          )}
        </div>

        <div className="cart-item__action-row">
          <div className="cart-item__controls">
            <div className="qty-stepper cart-item__qty" role="group" aria-label="Quantity">
              <button
                type="button"
                className="qty-stepper__btn"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                aria-label="Decrease quantity"
              >
                <Minus size={13} />
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
                <Plus size={13} />
              </button>
            </div>

            <button
              type="button"
              className="cart-item__remove"
              onClick={() => removeItem(item.id)}
              aria-label={`Remove ${item.name}`}
              title="Remove item"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="cart-item__aside">
            {hasItemDiscount ? (
              <div className="cart-item__price-group">
                <span className="cart-item__price-original">{formatPrice(lineTotal)}</span>
                <p className="cart-item__price cart-item__price--discounted">
                  {formatPrice(finalLineTotal)}
                </p>
                <span className="cart-item__coupon-tag">
                  <Tag size={10} /> Saved {formatPrice(savings)}
                </span>
              </div>
            ) : (
              <p className="cart-item__price">{formatPrice(lineTotal)}</p>
            )}
            {item.quantity > 1 && (
              <p className="cart-item__qty-note">
                {item.quantity} × {formatPrice(hasItemDiscount ? Math.round(finalLineTotal / item.quantity) : item.price)}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

