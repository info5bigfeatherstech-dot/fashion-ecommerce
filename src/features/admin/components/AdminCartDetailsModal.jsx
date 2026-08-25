import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useAdminCartDetail, useAdminUserDetail } from '@/features/admin/hooks'

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount ?? 0)

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${date} ${time}`
}

function formatVariantAttributes(attributes = []) {
  if (!attributes.length) return null
  return attributes.map((attr) => `${attr.key}: ${attr.value}`).join(' · ')
}

function CartItemRow({ item }) {
  const variantLabel = formatVariantAttributes(item.variantAttributes || [])

  return (
    <div className="admin-cart-modal__item">
      <div className="admin-cart-modal__thumb">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.productName || ''}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <span className="admin-cart-modal__thumb-empty" aria-hidden="true">🛒</span>
        )}
      </div>

      <div className="admin-cart-modal__item-main">
        <h4>{item.productName || 'Product'}</h4>
        {variantLabel ? <p className="admin-cart-modal__meta">{variantLabel}</p> : null}
        {(item.productCode ?? item.sku) ? (
          <p className="admin-cart-modal__meta">Product code: {item.productCode ?? item.sku}</p>
        ) : null}
        <p className="admin-cart-modal__qty">
          Qty: <strong>{item.quantity}</strong>
          <span> × </span>
          {formatCurrency(item.unitPrice)}
        </p>
      </div>

      <div className="admin-cart-modal__item-side">
        <p className="admin-cart-modal__line-total">{formatCurrency(item.lineTotal)}</p>
        {item.addedAt ? (
          <div className="admin-cart-modal__added">
            <span>Added</span>
            <small>{formatDateTime(item.addedAt)}</small>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function AdminCartDetailsModal({
  open,
  onClose,
  userId = null,
  cartId = null,
  fallbackUser = null,
}) {
  const fetchByCart = open && Boolean(cartId)
  const fetchByUser = open && Boolean(userId) && !cartId

  const cartQuery = useAdminCartDetail(cartId, { enabled: fetchByCart })
  const userQuery = useAdminUserDetail(userId, { enabled: fetchByUser })

  const cartPayload = cartQuery.data?.data && typeof cartQuery.data.data === 'object'
    ? cartQuery.data.data
    : cartQuery.data
  const userPayload = userQuery.data?.data && typeof userQuery.data.data === 'object'
    ? userQuery.data.data
    : userQuery.data

  const cart = fetchByCart
    ? (cartPayload?.cart || cartPayload || null)
    : (userPayload?.cart || null)
  const customer = cart?.user || userPayload?.user || fallbackUser || null
  const items = cart?.items || []

  const isLoading = fetchByCart ? cartQuery.isLoading : userQuery.isLoading
  const isError = fetchByCart ? cartQuery.isError : userQuery.isError
  const error = fetchByCart ? cartQuery.error : userQuery.error
  const isFetching = fetchByCart ? cartQuery.isFetching : userQuery.isFetching

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.documentElement.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('modal-open')
    }
  }, [open, onClose])

  if (!open) return null

  const itemCount = cart?.itemCount ?? items.length

  return (
    <div className="admin-cart-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="admin-cart-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-cart-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-cart-modal__head">
          <div>
            <h3 id="admin-cart-details-title">Cart Details</h3>
            {customer ? (
              <p>
                {customer.name || 'Customer'}
                {customer.email ? ` · ${customer.email}` : ''}
              </p>
            ) : null}
          </div>
          <button type="button" className="admin-cart-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="admin-cart-modal__body">
          {isLoading ? (
            <div className="admin-cart-modal__state">
              <span className="admin-cart-modal__spinner" />
              <p>Loading cart items…</p>
            </div>
          ) : isError ? (
            <div className="admin-cart-modal__state">
              <p className="admin-cart-modal__error">Failed to load cart details</p>
              <p>{error?.message || 'Please try again later'}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="admin-cart-modal__state">
              <p className="admin-cart-modal__empty-title">Cart is empty</p>
              <p>This customer has no items in their cart.</p>
            </div>
          ) : (
            <div className="admin-cart-modal__list">
              {isFetching && !isLoading ? (
                <p className="admin-cart-modal__refreshing">Refreshing…</p>
              ) : null}
              {items.map((item, index) => (
                <CartItemRow
                  key={`${item.productId || item._id || 'item'}-${item.variantId || index}`}
                  item={item}
                />
              ))}
            </div>
          )}
        </div>

        {cart && items.length > 0 ? (
          <div className="admin-cart-modal__foot">
            <p>
              {itemCount} item{itemCount !== 1 ? 's' : ''}
              {cart.updatedAt ? ` · Last updated ${formatDateTime(cart.updatedAt)}` : ''}
            </p>
            <div className="admin-cart-modal__total">
              <span>Cart Total</span>
              <strong>{formatCurrency(cart.totalAmount)}</strong>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
