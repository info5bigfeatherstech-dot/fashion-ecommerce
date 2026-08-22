import { Link } from 'react-router-dom'
import { ChevronRight, Package } from 'lucide-react'
import {
  canResumeOnlinePayment,
  formatOrderDate,
  getOrderItemCount,
  getOrderItemImage,
  getOrderItemName,
  getOrderItemProductHref,
  getOrderItemVariantLabel,
  getOrderItems,
  getOrderItemsSummary,
  getOrderStatusClass,
  getOrderStatusLabel,
} from '@/features/orders/utils'
import { formatPrice } from '@/lib/utils'

const PREVIEW_LIMIT = 2

function OrderStatusBadge({ status }) {
  return (
    <span className={`account-order-status ${getOrderStatusClass(status)}`}>
      {getOrderStatusLabel(status)}
    </span>
  )
}

function OrderProductMedia({ item, label, extraCount = 0 }) {
  const image = item ? getOrderItemImage(item) : null
  const href = item ? getOrderItemProductHref(item) : null

  const content = (
    <>
      {image ? (
        <img src={image} alt="" loading="lazy" />
      ) : (
        <Package size={18} aria-hidden="true" />
      )}
      {extraCount > 0 && (
        <span className="account-order-card__media-count">+{extraCount}</span>
      )}
    </>
  )

  if (href) {
    return (
      <Link to={href} className="account-order-card__media account-order-card__product-link" aria-label={label}>
        {content}
      </Link>
    )
  }

  return (
    <div className="account-order-card__media" aria-hidden="true">
      {content}
    </div>
  )
}

export function AccountOrderCard({ order, onSelect, isHydrating = false }) {
  const items = getOrderItems(order)
  const itemCount = getOrderItemCount(order)
  const hasItems = items.length > 0
  const primaryItem = items[0]
  const primaryName = hasItems
    ? getOrderItemsSummary(order)
    : (isHydrating ? 'Loading order…' : 'Order items')
  const primaryHref = primaryItem ? getOrderItemProductHref(primaryItem) : null
  const primaryVariant = primaryItem ? getOrderItemVariantLabel(primaryItem) : null
  const extraCount = Math.max(0, items.length - 1)

  return (
    <article className="account-order-card">
      <div className="account-order-card__row">
        <OrderProductMedia item={primaryItem} label={primaryName} extraCount={extraCount} />

        <div className="account-order-card__content">
          {primaryHref ? (
            <Link to={primaryHref} className="account-order-card__title account-order-card__product-link">
              {primaryName}
            </Link>
          ) : (
            <p className="account-order-card__title">{primaryName}</p>
          )}

          <p className="account-order-card__meta">
            {formatOrderDate(order.createdAt)}
            {itemCount > 0 ? ` · ${itemCount} item${itemCount === 1 ? '' : 's'}` : ''}
          </p>

          {primaryVariant ? (
            <p className="account-order-card__variant">{primaryVariant}</p>
          ) : null}

          {canResumeOnlinePayment(order) && (
            <p className="account-order-card__hint">Payment pending</p>
          )}
        </div>

        <button
          type="button"
          className="account-order-card__aside"
          onClick={() => onSelect(order.orderId)}
          aria-label={`View order from ${formatOrderDate(order.createdAt)}`}
        >
          <OrderStatusBadge status={order.orderStatus} />
          <p className="account-order-card__price">{formatPrice(order.totalAmount ?? 0)}</p>
        </button>

        <button
          type="button"
          className="account-order-card__chevron"
          onClick={() => onSelect(order.orderId)}
          aria-label="View order details"
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>

      {items.length > 1 && (
        <div className="account-order-card__extras">
          {items.slice(1, PREVIEW_LIMIT + 1).map((item, index) => {
            const href = getOrderItemProductHref(item)
            const label = `${getOrderItemName(item)}${Number(item.quantity) > 1 ? ` · Qty ${item.quantity}` : ''}`

            if (href) {
              return (
                <Link
                  key={item._id || item.id || `extra-${index}`}
                  to={href}
                  className="account-order-card__extra-line account-order-card__product-link"
                >
                  {label}
                </Link>
              )
            }

            return (
              <p key={item._id || item.id || `extra-${index}`} className="account-order-card__extra-line">
                {label}
              </p>
            )
          })}
          {items.length > PREVIEW_LIMIT + 1 && (
            <button
              type="button"
              className="account-order-card__extra-line account-order-card__extra-line--muted account-order-card__extra-line--action"
              onClick={() => onSelect(order.orderId)}
            >
              +{items.length - PREVIEW_LIMIT - 1} more item{items.length - PREVIEW_LIMIT - 1 === 1 ? '' : 's'}
            </button>
          )}
        </div>
      )}
    </article>
  )
}
