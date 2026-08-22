import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Lock, ShoppingBag, Sparkles, Truck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CartItem } from '@/features/cart/components/CartItem'
import { useCart } from '@/features/cart/hooks'
import { useAppStore } from '@/store'
import { useCartDiscount, useCartTotal } from '@/store/selectors'
import { formatPrice } from '@/lib/utils'
import { CheckoutAddressModal } from '@/components/checkout/CheckoutAddressModal'

const FREE_SHIPPING_THRESHOLD = 100

export default function Cart() {
  const cartItems = useAppStore((s) => s.cartItems)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const cartTotalFromItems = useCartTotal()
  const { totalDiscount, totalAmount: apiTotalAmount } = useCartDiscount()
  const cartTotal = apiTotalAmount > 0 ? apiTotalAmount : cartTotalFromItems
  const clearCart = useAppStore((s) => s.clearCart)
  const navigate = useNavigate()
  const [checkoutAddressOpen, setCheckoutAddressOpen] = useState(false)

  const { isFetching: cartSyncing } = useCart({ enabled: isAuthenticated })

  useEffect(() => {
    if (!isAuthenticated || cartItems.length === 0) return
    void import('./Checkout')
  }, [isAuthenticated, cartItems.length])

  const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
  const shipping = cartTotal >= FREE_SHIPPING_THRESHOLD ? 0 : 9.95
  const total = cartTotal + shipping
  const shippingProgress = Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100)
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal)

  if (!isAuthenticated) {
    return (
      <div className="cart-page">
        <div className="container cart-page__inner">
          <div className="cart-empty">
            <div className="cart-empty__icon">
              <Lock size={24} />
            </div>
            <h1 className="cart-empty__title">Sign in to view your bag</h1>
            <p className="body-lg text-muted">Your saved pieces will appear here after you log in.</p>
            <Link to="/login">
              <Button variant="primary">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container cart-page__inner">
          <div className="cart-empty">
            <div className="cart-empty__icon">
              <ShoppingBag size={24} />
            </div>
            <h1 className="cart-empty__title">Your bag is empty</h1>
            <p className="body-lg text-muted">Discover jewelry you&apos;ll reach for every day.</p>
            <Link to="/shop/women">
              <Button variant="primary">Start Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="container cart-page__inner">
        <header className="cart-page__header">
          <Link to="/shop/women" className="checkout-back">
            <ArrowLeft size={16} />
            Continue shopping
          </Link>

          <div className="cart-page__heading">
            <div>
              <p className="heading-sm text-accent">Your selection</p>
              <h1 className="display-lg">Shopping Bag</h1>
              <p className="body-sm text-muted">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} ready for checkout
              </p>
            </div>
            <button type="button" className="cart-page__clear" onClick={clearCart}>
              Clear bag
            </button>
          </div>
        </header>

        <div className="checkout cart-page__layout">
          <section className="cart-page__list" aria-label="Bag items">
            {cartSyncing && cartItems.length === 0 ? (
              <p className="body-lg text-muted">Loading your bag…</p>
            ) : (
              cartItems.map((item) => (
                <CartItem key={item.id} item={item} layout="page" />
              ))
            )}
          </section>

          <aside className="checkout-summary cart-summary">
            <div className="checkout-summary__head">
              <h2 className="checkout-panel__title">Order Summary</h2>
              <span className="body-sm text-muted">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="cart-summary__shipping">
              <div className="cart-summary__shipping-top">
                <Truck size={16} />
                <p className="body-sm">
                  {shipping === 0 ? (
                    <>You&apos;ve unlocked <strong>free shipping</strong></>
                  ) : (
                    <>
                      Add <strong>{formatPrice(remainingForFreeShipping)}</strong> for free shipping
                    </>
                  )}
                </p>
              </div>
              <div
                className="cart-summary__progress"
                role="progressbar"
                aria-valuenow={Math.round(shippingProgress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progress toward free shipping"
              >
                <span style={{ width: `${shippingProgress}%` }} />
              </div>
            </div>

            <div className="checkout-summary__rows">
              <div className="checkout-summary__row">
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="checkout-summary__row">
                  <span>Discount</span>
                  <span>-{formatPrice(totalDiscount)}</span>
                </div>
              )}
              <div className="checkout-summary__row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              <div className="checkout-summary__total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              className="cart-summary__cta"
              onClick={() => setCheckoutAddressOpen(true)}
            >
              Proceed to Checkout
              <ArrowRight size={16} />
            </Button>

            <p className="cart-summary__secure">
              <Sparkles size={14} />
              Secure checkout · Easy returns
            </p>
          </aside>
        </div>
      </div>

      {checkoutAddressOpen && (
        <CheckoutAddressModal
          open={checkoutAddressOpen}
          onOpenChange={setCheckoutAddressOpen}
          onProceed={() => navigate('/checkout')}
        />
      )}
    </div>
  )
}
