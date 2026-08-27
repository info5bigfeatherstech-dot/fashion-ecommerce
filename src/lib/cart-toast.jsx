import { toast } from 'sonner'
import { CartAddedToast } from '@/components/ui/CartAddedToast'

export function showAddedToCartToast(product, { quantity = 1, onViewBag } = {}) {
  toast.custom(
    (id) => (
      <CartAddedToast
        id={id}
        product={product}
        quantity={quantity}
        onViewBag={onViewBag}
      />
    ),
    { duration: 2000, unstyled: true }
  )
}

export function notifyBagError(error, fallback = 'Could not update bag') {
  toast.error(error?.message || fallback)
}

export function notifyWishlistError(error, fallback = 'Could not update wishlist') {
  toast.error(error?.message || fallback)
}
