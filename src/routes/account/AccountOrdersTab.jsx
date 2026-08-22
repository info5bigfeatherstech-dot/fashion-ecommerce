import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Loader2, Package, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useOrdersWithDetails, useUserOrders } from '@/features/orders/hooks'
import { getOrderItems } from '@/features/orders/utils'
import { AccountOrderCard } from '@/routes/account/AccountOrderCard'
import { AccountOrderDetail } from '@/routes/account/AccountOrderDetail'

export function AccountOrdersTab() {
  const location = useLocation()
  const [selectedOrderId, setSelectedOrderId] = useState(location.state?.openOrderId ?? null)
  const { data, isLoading, isError, error, refetch, isFetching } = useUserOrders()
  const orders = data?.orders ?? []
  const { orders: enrichedOrders, isHydrating } = useOrdersWithDetails(orders, {
    enabled: !selectedOrderId,
  })

  useEffect(() => {
    if (location.state?.openOrderId) {
      setSelectedOrderId(location.state.openOrderId)
    }
  }, [location.state?.openOrderId])

  if (selectedOrderId) {
    return (
      <AccountOrderDetail
        orderId={selectedOrderId}
        onBack={() => setSelectedOrderId(null)}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="account-orders-state">
        <Loader2 size={22} className="account-orders-state__spin" aria-hidden="true" />
        <p className="body-sm text-muted">Loading your orders…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="account-panel">
        <div className="account-empty">
          <p className="body-lg">{error?.message || 'Failed to load orders'}</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} aria-hidden="true" />
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="account-panel">
        <div className="account-empty">
          <div className="account-empty__icon"><Package size={22} /></div>
          <p className="body-lg">No orders yet</p>
          <p className="body-sm text-muted">Start shopping to see your orders here.</p>
          <Link to="/shop/women" style={{ marginTop: 'var(--space-2)' }}>
            <Button variant="primary">Start shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="account-orders">
      <p className="account-orders__count body-sm text-muted">
        {orders.length} order{orders.length !== 1 ? 's' : ''}
        {(isFetching || isHydrating) && !isLoading ? ' · updating…' : ''}
      </p>

      <div className="account-orders__list">
        {enrichedOrders.map((order) => (
          <AccountOrderCard
            key={order.orderId}
            order={order}
            isHydrating={isHydrating && getOrderItems(order).length === 0}
            onSelect={setSelectedOrderId}
          />
        ))}
      </div>
    </div>
  )
}
