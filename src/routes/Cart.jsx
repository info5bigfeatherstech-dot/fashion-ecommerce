import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { CartItem } from '@/features/cart/components/CartItem'
import { useAppStore } from '@/store'
import { useCartTotal } from '@/store/selectors'
import { formatPrice } from '@/lib/utils'

export default function Cart() {
  const cartItems = useAppStore((s) => s.cartItems)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const cartTotal = useCartTotal()
  const clearCart = useAppStore((s) => s.clearCart)

  if (!isAuthenticated) {
    return (
      <div className="container empty-state">
        <h1 className="empty-state__title">Sign in to view your bag</h1>
        <p className="body-lg text-muted">Your bag items will appear here after login.</p>
        <Link to="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container empty-state">
        <h1 className="empty-state__title">Your bag is empty</h1>
        <p className="body-lg text-muted">Discover something you'll love.</p>
        <Link to="/shop/women">
          <Button variant="primary">Start Shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h1 className="display-lg">Shopping Bag</h1>
        <button className="body-sm section-header__link" onClick={clearCart}>Clear Bag</button>
      </div>

      <div className="checkout">
        <div>
          {cartItems.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        <div className="checkout-summary">
          <h2 className="checkout-section__title">Order Summary</h2>
          <div className="checkout-summary__row">
            <span>Subtotal</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
          <div className="checkout-summary__row">
            <span>Shipping</span>
            <span>{cartTotal >= 100 ? 'Free' : formatPrice(9.95)}</span>
          </div>
          <div className="checkout-summary__total">
            <span>Total</span>
            <span>{formatPrice(cartTotal + (cartTotal >= 100 ? 0 : 9.95))}</span>
          </div>
          <Link to="/checkout" style={{ display: 'block', marginTop: 'var(--space-3)' }}>
            <Button variant="primary" fullWidth>Proceed to Checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
