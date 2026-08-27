import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CheckoutAddressModal } from '@/components/checkout/CheckoutAddressModal'
import { CartItem } from '@/features/cart/components/CartItem'
import { useCart } from '@/features/cart/hooks'
import { prefetchCheckoutRoute } from '@/features/checkout/prefetchRoute'
import { useAppStore } from '@/store'
import { useCartTotal } from '@/store/selectors'
import { formatPrice } from '@/lib/utils'

export function AccountCartTab() {
  const navigate = useNavigate()
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const cartItems = useAppStore((s) => s.cartItems)
  const cartTotal = useCartTotal()
  const [checkoutAddressOpen, setCheckoutAddressOpen] = useState(false)

  useCart({ enabled: isAuthenticated })
  const bagCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)

  // Warm Checkout while the user reviews the bag (before they open the modal).
  useEffect(() => {
    if (!isAuthenticated || cartItems.length === 0) return
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => { void prefetchCheckoutRoute() }, { timeout: 1500 })
      : window.setTimeout(() => { void prefetchCheckoutRoute() }, 200)
    return () => {
      if (window.cancelIdleCallback && typeof idle === 'number') {
        window.cancelIdleCallback(idle)
      } else {
        window.clearTimeout(idle)
      }
    }
  }, [isAuthenticated, cartItems.length])

  const openCheckoutAddress = () => {
    void prefetchCheckoutRoute()
    setCheckoutAddressOpen(true)
  }

  return (
    <>
      <div className="account-section">
        <div className="account-section__header">
          <div>
            <p className="heading-sm text-accent">Bag</p>
            <h2 className="display-md">Shopping Bag</h2>
            {cartItems.length > 0 && (
              <p className="body-sm text-muted" style={{ marginTop: 4 }}>
                {bagCount} {bagCount === 1 ? 'item' : 'items'} selected
              </p>
            )}
          </div>
          {cartItems.length > 0 && (
            <Link to="/shop/women">
              <Button variant="secondary" size="sm">Continue shopping</Button>
            </Link>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="account-panel">
            <div className="account-empty">
              <div className="account-empty__icon"><ShoppingBag size={22} /></div>
              <p className="body-lg">Your bag is empty</p>
              <p className="body-sm text-muted">Add jewelry you love and it will show up here.</p>
              <Link to="/shop/women" style={{ marginTop: 'var(--space-2)' }}>
                <Button variant="primary">Start shopping</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="account-bag">
            <section className="account-bag__list" aria-label="Bag items">
              {cartItems.map((item) => (
                <CartItem key={item.id} item={item} layout="account" />
              ))}
            </section>

            <aside className="account-bag__summary">
              <p className="account-bag__summary-label">Order summary</p>
              <div className="account-bag__summary-rows">
                <div className="account-bag__summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="account-bag__summary-row account-bag__summary-row--muted">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="account-bag__summary-total">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
              </div>
              <Button
                variant="primary"
                fullWidth
                className="account-bag__cta"
                onClick={openCheckoutAddress}
                onPointerEnter={() => { void prefetchCheckoutRoute() }}
              >
                Proceed to checkout
              </Button>
              <Link to="/shop/women" className="account-bag__continue">
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </div>

      {checkoutAddressOpen && (
        <CheckoutAddressModal
          open={checkoutAddressOpen}
          onOpenChange={setCheckoutAddressOpen}
          onProceed={() => navigate('/checkout')}
        />
      )}
    </>
  )
}
