import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Clock, Eye, Package, Truck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  canResumeOnlinePayment,
  canShow24HourOption,
  formatOrderDate,
  getHoursRemainingIn24h,
  getOrderItemCount,
  getOrderItemImage,
  getOrderItemName,
  getOrderItemProductHref,
  getOrderItemVariantLabel,
  getOrderItems,
  getOrderItemsSummary,
  getOrderStatusClass,
  getOrderStatusLabel,
  isOrderTrackable,
} from '@/features/orders/utils'
import { formatPrice } from '@/lib/utils'
import {
  Order24HourChangeModal,
  OrderTrackingModal,
} from '@/features/orders/components'

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
  const [showTracking, setShowTracking] = useState(false)
  const [showChangeModal, setShowChangeModal] = useState(false)

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

  const canTrack = String(order.orderStatus || '').toLowerCase() !== 'cancelled'
  const can24h = canShow24HourOption(order)
  const hoursLeft = can24h ? getHoursRemainingIn24h(order.createdAt) : 0

  return (
    <>
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

        {/* Action buttons row for quick access */}
        <div className="account-order-card__actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onSelect(order.orderId)}
            className="account-order-card__btn"
          >
            <Eye size={14} />
            View Details
          </Button>

          {canTrack && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowTracking(true)}
              className="account-order-card__btn account-order-card__btn--track"
            >
              <Truck size={14} />
              Track Order
            </Button>
          )}

          {can24h && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowChangeModal(true)}
              className="account-order-card__btn account-order-card__btn--24h"
              title="Order Confirmed - Submit change request within 24 hours"
            >
              <Clock size={14} />
              24h Request ({hoursLeft}h left)
            </Button>
          )}
        </div>
      </article>

      {showTracking && (
        <OrderTrackingModal
          open={showTracking}
          onClose={() => setShowTracking(false)}
          orderId={order.orderId}
          initialTracking={order.shipmentInfo ? {
            orderId: order.orderId,
            currentStatus: order.orderStatus,
            trackingNumber: order.shipmentInfo.trackingNumber || order.shipmentInfo.awbCode,
            courier: order.shipmentInfo.courier,
            estimatedDelivery: order.shipmentInfo.estimatedDelivery,
            providerStatus: order.shipmentInfo.providerStatus,
          } : null}
        />
      )}

      {showChangeModal && (
        <Order24HourChangeModal
          open={showChangeModal}
          onClose={() => setShowChangeModal(false)}
          order={order}
        />
      )}
    </>
  )
}
