import { ChevronRight, Package } from 'lucide-react'
import {
  canResumeOnlinePayment,
  formatOrderDate,
  getOrderItemCount,
  getOrderItemImage,
  getOrderItemName,
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

export function AccountOrderCard({ order, onSelect, isHydrating = false }) {
  const items = getOrderItems(order)
  const itemCount = getOrderItemCount(order)
  const hasItems = items.length > 0
  const primaryItem = items[0]
  const primaryName = hasItems
    ? getOrderItemsSummary(order)
    : (isHydrating ? 'Loading order…' : 'Order items')
  const primaryImage = primaryItem ? getOrderItemImage(primaryItem) : null
  const primaryVariant = primaryItem ? getOrderItemVariantLabel(primaryItem) : null
  const extraCount = Math.max(0, items.length - 1)

  return (
    <button
      type="button"
      className="account-order-card"
      onClick={() => onSelect(order.orderId)}
      aria-label={`Order from ${formatOrderDate(order.createdAt)}, ${primaryName}`}
    >
      <div className="account-order-card__row">
        <div className="account-order-card__media">
          {primaryImage ? (
            <img src={primaryImage} alt="" loading="lazy" />
          ) : (
            <Package size={18} aria-hidden="true" />
          )}
          {extraCount > 0 && (
            <span className="account-order-card__media-count">+{extraCount}</span>
          )}
        </div>

        <div className="account-order-card__content">
          <p className="account-order-card__title">{primaryName}</p>

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

        <div className="account-order-card__aside">
          <OrderStatusBadge status={order.orderStatus} />
          <p className="account-order-card__price">{formatPrice(order.totalAmount ?? 0)}</p>
        </div>

        <span className="account-order-card__chevron" aria-hidden="true">
          <ChevronRight size={18} strokeWidth={2} />
        </span>
      </div>

      {items.length > 1 && (
        <div className="account-order-card__extras">
          {items.slice(1, PREVIEW_LIMIT + 1).map((item, index) => (
            <p key={item._id || item.id || `extra-${index}`} className="account-order-card__extra-line">
              {getOrderItemName(item)}
              {Number(item.quantity) > 1 ? ` · Qty ${item.quantity}` : ''}
            </p>
          ))}
          {items.length > PREVIEW_LIMIT + 1 && (
            <p className="account-order-card__extra-line account-order-card__extra-line--muted">
              +{items.length - PREVIEW_LIMIT - 1} more item{items.length - PREVIEW_LIMIT - 1 === 1 ? '' : 's'}
            </p>
          )}
        </div>
      )}
    </button>
  )
}
