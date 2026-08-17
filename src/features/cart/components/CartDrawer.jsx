import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store'
import { useCartTotal } from '@/store/selectors'
import { formatPrice } from '@/lib/utils'
import { CartItem } from './CartItem'

export function CartDrawer() {
  const isCartOpen = useAppStore((s) => s.isCartOpen)
  const closeCart = useAppStore((s) => s.closeCart)
  const cartItems = useAppStore((s) => s.cartItems)
  const cartTotal = useCartTotal()

  return (
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
              <h2 className="drawer__title">Your Bag</h2>
              <button className="btn btn--ghost btn--icon" onClick={closeCart} aria-label="Close cart">
                <X size={20} />
              </button>
            </div>
            <div className="drawer__body">
              {cartItems.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-4)' }}>
                  <p className="body-lg text-muted">Your bag is empty</p>
                  <Button variant="secondary" onClick={closeCart}>Continue Shopping</Button>
                </div>
              ) : (
                cartItems.map((item) => <CartItem key={item.id} item={item} />)
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="drawer__footer">
                <div className="checkout-summary__row" style={{ marginBottom: 'var(--space-2)' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 'var(--weight-semibold)' }}>{formatPrice(cartTotal)}</span>
                </div>
                <Link to="/checkout" onClick={closeCart}>
                  <Button variant="primary" fullWidth>Checkout</Button>
                </Link>
                <Link to="/cart" onClick={closeCart} style={{ display: 'block', textAlign: 'center', marginTop: 'var(--space-2)' }}>
                  <span className="body-sm section-header__link">View Full Bag</span>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
