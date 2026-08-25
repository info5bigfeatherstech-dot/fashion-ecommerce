import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useAdminUserDetail } from '@/features/admin/hooks'

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount ?? 0)

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function DetailRow({ label, children }) {
  return (
    <div className="admin-customer-modal__row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function DateTimeValue({ iso }) {
  if (!iso) return <span className="admin-customer-modal__muted">—</span>
  return (
    <div className="admin-customer-modal__datetime">
      <span>{formatDate(iso)}</span>
      <small>{formatTime(iso)}</small>
    </div>
  )
}

export function AdminCustomerDetailsModal({
  open,
  onClose,
  userId = null,
  initialUser = null,
  onViewCart,
}) {
  const { data, isLoading, isError, error, isFetching } = useAdminUserDetail(userId, {
    enabled: open && Boolean(userId),
  })

  const payload = data?.data && typeof data.data === 'object' ? data.data : data
  const user = payload?.user || initialUser
  const cart = payload?.cart
  const wishlist = payload?.wishlist

  const cartItemCount = cart?.itemCount ?? cart?.items?.length ?? initialUser?.cartItemsCount ?? 0
  const wishlistCount = wishlist?.products?.length ?? initialUser?.wishlistCount ?? 0
  const isVerified = Boolean(user?.isEmailVerified || user?.isPhoneVerified || user?.isVerified)
  const displayName = user?.name || initialUser?.name || 'Customer'
  const initial = displayName.charAt(0).toUpperCase()

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

  return (
    <div className="admin-customer-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="admin-customer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-customer-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-customer-modal__head">
          <h3 id="admin-customer-details-title">Customer Details</h3>
          <button type="button" className="admin-customer-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="admin-customer-modal__body">
          {isLoading && !user ? (
            <div className="admin-customer-modal__state">
              <span className="admin-customer-modal__spinner" />
              <p>Loading customer details…</p>
            </div>
          ) : isError && !user ? (
            <div className="admin-customer-modal__state">
              <p className="admin-customer-modal__error">Failed to load customer details</p>
              <p>{error?.message || 'Please try again later'}</p>
            </div>
          ) : (
            <>
              {isFetching && !isLoading ? (
                <p className="admin-customer-modal__refreshing">Refreshing…</p>
              ) : null}

              <div className="admin-customer-modal__profile">
                <span className="admin-customer-modal__avatar" aria-hidden="true">{initial}</span>
                <div>
                  <p className="admin-customer-modal__name">{displayName}</p>
                  <span className={`admin-customer-modal__badge${isVerified ? ' is-verified' : ''}`}>
                    {isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>

              <dl className="admin-customer-modal__dl">
                <DetailRow label="Email">
                  {user?.email || <span className="admin-customer-modal__muted">Not provided</span>}
                </DetailRow>
                <DetailRow label="Phone">
                  {user?.phone || <span className="admin-customer-modal__muted">Not provided</span>}
                </DetailRow>
                <DetailRow label="Role">
                  <span className="admin-customer-modal__cap">{user?.role || 'user'}</span>
                </DetailRow>
                <DetailRow label="Status">
                  <span className="admin-customer-modal__cap">{user?.status || 'active'}</span>
                </DetailRow>
                <DetailRow label="Joined">
                  <DateTimeValue iso={user?.createdAt || initialUser?.createdAt} />
                </DetailRow>
                <DetailRow label="Last active">
                  <DateTimeValue iso={user?.updatedAt || user?.lastActive} />
                </DetailRow>
                <DetailRow label="Cart">
                  <div className="admin-customer-modal__cart">
                    <span className="admin-customer-modal__cart-count">
                      {cartItemCount} item{cartItemCount !== 1 ? 's' : ''}
                    </span>
                    {cart?.totalAmount > 0 ? (
                      <span className="admin-customer-modal__cart-total">· {formatCurrency(cart.totalAmount)}</span>
                    ) : null}
                    {cartItemCount > 0 && onViewCart ? (
                      <button
                        type="button"
                        className="admin-customer-modal__view-cart"
                        onClick={() => {
                          onClose()
                          onViewCart(userId, user || initialUser)
                        }}
                      >
                        View cart
                      </button>
                    ) : null}
                  </div>
                </DetailRow>
                <DetailRow label="Wishlist">
                  <span className="admin-customer-modal__wish">
                    {wishlistCount} item{wishlistCount !== 1 ? 's' : ''}
                  </span>
                </DetailRow>
                {user?.registrationMethod ? (
                  <DetailRow label="Registered via">
                    <span className="admin-customer-modal__cap">{user.registrationMethod}</span>
                  </DetailRow>
                ) : null}
              </dl>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
