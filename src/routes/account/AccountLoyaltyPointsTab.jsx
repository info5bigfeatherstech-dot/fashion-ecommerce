import { useMemo } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useMyLoyaltyLedger, useMyLoyaltyPoints } from '@/features/loyaltyPoints/hooks'

const TYPE_META = {
  earn: { label: 'Earned', Icon: ArrowDownLeft, tone: 'earn' },
  redeem: { label: 'Used at checkout', Icon: ArrowUpRight, tone: 'redeem' },
  redeem_restore: { label: 'Points restored', Icon: RotateCcw, tone: 'restore' },
  earn_clawback: { label: 'Points reversed', Icon: RotateCcw, tone: 'clawback' },
  expire: { label: 'Expired', Icon: Coins, tone: 'expire' },
  adjust: { label: 'Adjusted', Icon: Sparkles, tone: 'adjust' },
}

function fmtDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

export function AccountLoyaltyPointsTab() {
  const { data: meData, isLoading: meLoading, isError: meError, error: meErr, refetch: refetchMe } =
    useMyLoyaltyPoints()
  const {
    data: ledgerData,
    isLoading: ledgerLoading,
    refetch: refetchLedger,
  } = useMyLoyaltyLedger({ page: 1 })

  const points = meData?.points
  const enabled = Boolean(points?.settings?.enabled)
  const balance = Math.max(0, Math.floor(Number(points?.balance) || 0))
  const items = ledgerData?.items || []

  const redeemValue = Number(points?.settings?.redeemRupeePerPoint) || 0
  const approxInr = useMemo(
    () => (redeemValue > 0 ? Math.floor(balance * redeemValue) : 0),
    [balance, redeemValue]
  )

  if (meLoading) {
    return (
      <div className="account-panel account-loyalty-points">
        <div className="account-empty">
          <Loader2 className="account-spin" size={28} />
          <p className="body-sm text-muted">Loading points…</p>
        </div>
      </div>
    )
  }

  if (meError) {
    return (
      <div className="account-panel account-loyalty-points">
        <div className="account-empty">
          <p className="body-lg">{meErr?.message || 'Could not load loyalty points'}</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => refetchMe()}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!enabled) {
    return (
      <div className="account-panel account-loyalty-points">
        <div className="account-empty">
          <Coins size={32} className="text-muted" />
          <p className="body-lg">Points program is currently off</p>
          <p className="body-sm text-muted">Check back later — nothing to show right now.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="account-loyalty-points">
      <div className="account-loyalty-points__balance">
        <p className="account-loyalty-points__eyebrow">Available balance</p>
        <p className="account-loyalty-points__balance-value">
          {balance}
          <span>points</span>
        </p>
        <p className="body-sm text-muted">
          Lifetime earned {Math.floor(Number(points?.lifetimeEarned) || 0)} · used{' '}
          {Math.floor(Number(points?.lifetimeRedeemed) || 0)}
        </p>
        {approxInr > 0 ? (
          <p className="account-loyalty-points__approx">
            ≈ ₹{approxInr.toLocaleString('en-IN')} off at checkout (subject to order limits)
          </p>
        ) : null}
      </div>

      <div className="account-panel">
        <div className="account-panel__header">
          <div>
            <p className="heading-sm text-accent">History</p>
            <h3 className="display-md">Point activity</h3>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              refetchMe()
              refetchLedger()
            }}
          >
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>

        {ledgerLoading ? (
          <div className="account-empty">
            <Loader2 className="account-spin" size={24} />
          </div>
        ) : items.length === 0 ? (
          <div className="account-empty">
            <p className="body-lg">No activity yet</p>
            <p className="body-sm text-muted">
              Points appear here after you complete an order or use them at checkout.
            </p>
          </div>
        ) : (
          <div className="account-loyalty-points__list">
            {items.map((row) => {
              const meta = TYPE_META[row.type] || TYPE_META.adjust
              const Icon = meta.Icon
              const pts = Number(row.points) || 0
              const positive = pts > 0
              return (
                <div
                  key={row._id || `${row.idempotencyKey}-${row.createdAt}`}
                  className={`account-loyalty-points__row account-loyalty-points__row--${meta.tone}`}
                >
                  <span className="account-loyalty-points__row-icon" aria-hidden>
                    <Icon size={16} />
                  </span>
                  <div className="account-loyalty-points__row-body">
                    <div className="account-loyalty-points__row-top">
                      <p className="account-loyalty-points__row-title">{meta.label}</p>
                      <p
                        className={`account-loyalty-points__row-pts${
                          positive ? ' is-plus' : ' is-minus'
                        }`}
                      >
                        {positive ? '+' : ''}
                        {pts}
                      </p>
                    </div>
                    <p className="account-loyalty-points__row-date">{fmtDate(row.createdAt)}</p>
                    {row.orderId ? (
                      <p className="account-loyalty-points__row-meta">Order {row.orderId}</p>
                    ) : null}
                    {row.note ? (
                      <p className="account-loyalty-points__row-meta">{row.note}</p>
                    ) : null}
                  </div>
                </div>
              )
            })}

          </div>
        )}
      </div>
    </div>
  )
}
