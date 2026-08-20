import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'

export function showAddedToCartToast(product, { quantity = 1, onViewBag } = {}) {
  const lineTotal = product.price * quantity
  const description =
    quantity > 1
      ? `${product.name} × ${quantity} · ${formatPrice(lineTotal)}`
      : `${product.name} · ${formatPrice(lineTotal)}`

  toast.success('Added to bag', {
    description,
    duration: 3500,
    ...(onViewBag && {
      action: {
        label: 'View bag',
        onClick: onViewBag,
      },
    }),
  })
}
