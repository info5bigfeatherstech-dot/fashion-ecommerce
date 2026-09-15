import { Package } from 'lucide-react'
import {
  getRemovedArchiveBadge,
  getRemovedArchiveLineTotal,
  getRemovedArchiveName,
  getRemovedArchiveQty,
  getRemovedArchiveSku,
  getRemovedArchiveUnitPrice,
  getRemovedItemsArchive,
} from '@/features/orders/removedItemsArchive'
import { formatPrice } from '@/lib/utils'

function formatMoney(amount, formatter) {
  try {
    if (typeof formatter === 'function') return formatter(amount)
    return formatPrice(amount)
  } catch {
    return '—'
  }
}

/**
 * Read-only list of lines removed / qty-cut before confirm.
 * @param {'admin' | 'account'} variant
 */
export function RemovedOrderItemsSection({
  order,
  variant = 'account',
  formatMoney: moneyFn,
  title = 'Removed items',
}) {
  const rows = getRemovedItemsArchive(order)
  if (!rows.length) return null

  const isAdmin = variant === 'admin'
  const rootClass = isAdmin ? 'od-removed-archive' : 'account-removed-archive'
  const rowClass = isAdmin ? 'od-removed-archive__row' : 'account-removed-archive__row'

  return (
    <div className={rootClass} aria-label={title}>
      <p className={isAdmin ? 'od-removed-archive__title' : 'account-removed-archive__title'}>
        {title}
      </p>
      <div className={isAdmin ? 'od-removed-archive__list' : 'account-removed-archive__list'}>
        {rows.map((row, index) => {
          const name = getRemovedArchiveName(row)
          const qty = getRemovedArchiveQty(row)
          const lineTotal = getRemovedArchiveLineTotal(row)
          const unit = getRemovedArchiveUnitPrice(row)
          const sku = getRemovedArchiveSku(row)
          const badge = getRemovedArchiveBadge(row)
          const key = [
            String(row?.productId?._id || row?.productId || ''),
            String(row?.variantId?._id || row?.variantId || ''),
            String(row?.removedAt || ''),
            String(index),
          ].join(':')

          return (
            <div key={key} className={rowClass}>
              <div className={isAdmin ? 'od-removed-archive__thumb' : 'account-removed-archive__thumb'}>
                <Package size={isAdmin ? 18 : 16} aria-hidden="true" />
              </div>
              <div className={isAdmin ? 'od-removed-archive__body' : 'account-removed-archive__body'}>
                <div className={isAdmin ? 'od-removed-archive__name-row' : 'account-removed-archive__name-row'}>
                  <p className={isAdmin ? 'od-removed-archive__name' : 'account-removed-archive__name'}>
                    {name}
                  </p>
                  <span className={isAdmin ? 'od-removed-archive__badge' : 'account-removed-archive__badge'}>
                    {badge}
                  </span>
                </div>
                <p className={isAdmin ? 'od-removed-archive__meta' : 'account-removed-archive__meta'}>
                  Qty {qty || '—'}
                  {unit != null ? ` · ${formatMoney(unit, moneyFn)} each` : ''}
                  {sku ? ` · SKU ${sku}` : ''}
                </p>
              </div>
              <p className={isAdmin ? 'od-removed-archive__price' : 'account-removed-archive__price'}>
                {formatMoney(lineTotal, moneyFn)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RemovedOrderItemsSection
