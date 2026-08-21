import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Lock, ShoppingBag, Sparkles, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store'
import { useCartTotal } from '@/store/selectors'
import { formatPrice } from '@/lib/utils'
import { useCartProducts } from '@/features/cart/hooks'
import { CartItem } from './CartItem'
import { CheckoutAddressModal } from '@/components/checkout/CheckoutAddressModal'

export function CartDrawer() {
  const isCartOpen = useAppStore((s) => s.isCartOpen)
  const closeCart = useAppStore((s) => s.closeCart)
  const cartItems = useAppStore((s) => s.cartItems)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const cartTotal = useCartTotal()
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const navigate = useNavigate()
  const [checkoutAddressOpen, setCheckoutAddressOpen] = useState(false)

  const { products: hydratedItems } = useCartProducts(cartItems, {
    enabled: isCartOpen && isAuthenticated && cartItems.length > 0,
  })

  return (
    <>
      <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            className="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.div
            className="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            role="dialog"
            aria-label="Shopping cart"
          >
            <div className="drawer__header">
              <div>
                <p className="drawer__eyebrow">Your cart</p>
                <h2 className="drawer__title">Shopping Bag</h2>
                <p className="drawer__meta">
                  {isAuthenticated ? `${itemCount} item${itemCount === 1 ? '' : 's'} saved` : 'Sign in to access your saved bag'}
                </p>
              </div>
              <button className="btn btn--ghost btn--icon" onClick={closeCart} aria-label="Close cart">
                <X size={20} />
              </button>
            </div>
            <div className="drawer__body">
              {!isAuthenticated ? (
                <div className="drawer__empty">
                  <div className="drawer__empty-icon">
                    <Lock size={22} />
                  </div>
                  <h3 className="drawer__empty-title">Sign in to view your bag</h3>
                  <p className="body-sm text-muted" style={{ textAlign: 'center' }}>
                    Your saved jewelry picks and checkout progress will show here after login.
                  </p>
                  <Link to="/login" onClick={closeCart}>
                    <Button variant="primary">Sign In</Button>
                  </Link>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="drawer__empty">
                  <div className="drawer__empty-icon">
                    <ShoppingBag size={22} />
                  </div>
                  <h3 className="drawer__empty-title">Your bag is empty</h3>
                  <p className="body-sm text-muted" style={{ textAlign: 'center' }}>
                    Add a few pieces you love and they will appear here instantly.
                  </p>
                  <Button variant="secondary" onClick={closeCart}>Continue Shopping</Button>
                </div>
              ) : (
                hydratedItems.map((item) => <CartItem key={item.id} item={item} />)
              )}
            </div>
            {isAuthenticated && cartItems.length > 0 && (
              <div className="drawer__footer">
                <div className="drawer__summary-card">
                  <div className="checkout-summary__row">
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 'var(--weight-semibold)' }}>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="checkout-summary__row">
                    <span>Shipping</span>
                    <span>{cartTotal >= 100 ? 'Free' : 'Calculated at checkout'}</span>
                  </div>
                  <div className="checkout-summary__row">
                    <span className="drawer__summary-note"><Sparkles size={14} /> Secure checkout</span>
                    <span className="body-sm text-muted">Fast and protected</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  className="drawer__cta-link"
                  onClick={() => {
                    closeCart()
                    setCheckoutAddressOpen(true)
                  }}
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </Button>
                <Link to="/cart" onClick={closeCart} style={{ display: 'block', textAlign: 'center', marginTop: 'var(--space-2)' }}>
                  <span className="body-sm section-header__link">View Full Bag</span>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
      </AnimatePresence>

      <CheckoutAddressModal
        open={checkoutAddressOpen}
        onOpenChange={setCheckoutAddressOpen}
        onProceed={() => navigate('/checkout')}
      />
    </>
  )
}
