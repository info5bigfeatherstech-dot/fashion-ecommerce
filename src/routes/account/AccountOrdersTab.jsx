import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Loader2, Package, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useOrdersWithDetails, useUserOrders } from '@/features/orders/hooks'
import { getOrderItems } from '@/features/orders/utils'
import { AccountOrderCard } from '@/routes/account/AccountOrderCard'
import { AccountOrderDetail } from '@/routes/account/AccountOrderDetail'

class DetailErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[DetailErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="account-panel">
          <div className="account-empty">
            <AlertCircle size={32} className="text-muted" style={{ margin: '0 auto 12px' }} />
            <p className="body-lg">Something went wrong loading order details</p>
            <p className="body-xs text-muted" style={{ maxWidth: 480, margin: '8px auto 16px' }}>
              {this.state.error?.message || String(this.state.error)}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                this.props.onBack()
              }}
            >
              Back to orders
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

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
      <DetailErrorBoundary onBack={() => setSelectedOrderId(null)}>
        <AccountOrderDetail
          orderId={selectedOrderId}
          onBack={() => setSelectedOrderId(null)}
        />
      </DetailErrorBoundary>
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
