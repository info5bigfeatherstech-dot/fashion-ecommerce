import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  Copy,
  Gift,
  Loader2,
  RefreshCw,
  Share2,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { SITE_NAME } from '@/config/site'
import { useGenerateReferral, useMyReferral } from '@/features/referral/hooks'
import { buildReferralShareText, referralDiscountLabel } from '@/features/referral/utils'
import { formatPrice } from '@/lib/utils'

function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.628 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

const LEDGER_LABELS = {
  referral_reward: 'Referral reward',
  referral_clawback: 'Referral reversed',
  redeem: 'Used at checkout',
  redeem_restore: 'Points restored',
  earn: 'Order reward',
  earn_clawback: 'Order reward reversed',
  expire: 'Expired',
  adjust: 'Adjusted',
}

function ledgerLabel(row) {
  return LEDGER_LABELS[row?.type] || 'Points update'
}

function ledgerRowKey(row, index) {
  return String(row?.id || `${row?.type || 'row'}-${row?.orderId || 'wallet'}-${row?.createdAt || index}`)
}

function ledgerDetail(row) {
  const order = row?.orderId ? `Order ${row.orderId}` : row?.note || 'Wallet'
  const when = formatWhen(row?.createdAt)
  return when ? `${order} · ${when}` : order
}

function formatWhen(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function AccountReferralTab() {
  const { data, isLoading, isError, error, refetch } = useMyReferral()
  const generate = useGenerateReferral()
  const [copied, setCopied] = useState(false)

  const settings = data?.settings
  const enabled = Boolean(settings?.enabled)
  const code = data?.code?.code || ''
  const stats = data?.stats || { completedUses: 0, pendingUses: 0, pointsAwarded: 0, pointsUsed: 0 }
  const wallet = data?.wallet || {
    balance: 0,
    lifetimeEarned: 0,
    lifetimeRedeemed: 0,
    approxInr: 0,
    redeemRupeePerPoint: 0,
    canRedeem: false,
  }
  const ledgerItems = Array.isArray(data?.ledger?.items) ? data.ledger.items : []
  const ledgerFailed = Boolean(data?.ledger?.failed)
  const discountLabel = referralDiscountLabel(settings)
  const rewardPoints = Math.max(0, Math.floor(Number(settings?.rewardPoints) || 0))
  const minOrder = Number(settings?.minOrderValue) || 0
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const balance = Math.max(0, Math.floor(Number(wallet.balance) || 0))
  const earnedPts = Math.max(0, Math.floor(Number(wallet.lifetimeEarned ?? stats.pointsAwarded) || 0))
  const usedPts = Math.max(0, Math.floor(Number(wallet.lifetimeRedeemed ?? stats.pointsUsed) || 0))
  const approxInr = Math.max(0, Number(wallet.approxInr) || 0)
  const canRedeem = Boolean(wallet.canRedeem) && balance > 0

  const shareText = useMemo(() => {
    if (!code) return ''
    return buildReferralShareText({ code, settings, siteName: SITE_NAME, origin })
  }, [code, settings, origin])

  const copyCode = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Referral code copied')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Could not copy code')
    }
  }

  const shareWhatsApp = () => {
    if (!shareText) return
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const shareNative = async () => {
    if (!shareText) return
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `${SITE_NAME} referral`, text: shareText })
        return
      } catch (err) {
        if (err?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(shareText)
      toast.success('Share message copied')
    } catch {
      toast.error('Could not share right now')
    }
  }

  const handleGenerate = async () => {
    try {
      await generate.mutateAsync()
      toast.success('Your referral code is ready')
    } catch (err) {
      toast.error(err?.message || 'Could not generate a referral code')
    }
  }

  if (isLoading) {
    return (
      <div className="account-panel account-referral">
        <div className="account-empty">
          <Loader2 className="account-spin" size={28} />
          <p className="body-sm text-muted">Loading referral…</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="account-panel account-referral">
        <div className="account-empty">
          <p className="body-lg">{error?.message || 'Could not load referral'}</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!enabled && !code) {
    return (
      <div className="account-panel account-referral">
        <div className="account-empty">
          <Gift size={32} className="text-muted" />
          <p className="body-lg">Referrals are paused right now</p>
          <p className="body-sm text-muted">Check back later — nothing to share at the moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="account-referral">
      <section className="account-referral__board">
        <div className="account-referral__head">
          <div className="account-referral__code-block">
            <p className="account-referral__eyebrow">Your code</p>
            {code ? (
              <div className="account-referral__code-row">
                <span className="account-referral__code">{code}</span>
                <Button type="button" variant="secondary" size="sm" onClick={copyCode}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button type="button" size="sm" className="account-referral__wa" onClick={shareWhatsApp}>
                  <WhatsAppIcon /> WhatsApp
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={shareNative}>
                  <Share2 size={14} /> Share
                </Button>
              </div>
            ) : (
              <div className="account-referral__code-row">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={generate.isPending || !enabled}
                >
                  {generate.isPending ? <Loader2 size={14} className="account-spin" /> : <Gift size={14} />}
                  {generate.isPending ? 'Generating…' : 'Generate code'}
                </Button>
              </div>
            )}
            <p className="account-referral__lead">
              Friends get {discountLabel}. You get <strong>{rewardPoints}</strong> points after they
              pay, or when COD is delivered.
              {minOrder > 0 ? ` Min. order ₹${minOrder.toLocaleString('en-IN')}.` : ''}
            </p>
          </div>

          <div className="account-referral__balance">
            <p className="account-referral__eyebrow">Available</p>
            <p className="account-referral__wallet-value">
              {balance.toLocaleString('en-IN')}
              <span>pts</span>
            </p>
            <p className="account-referral__wallet-rupees">
              {approxInr > 0 ? `≈ ${formatPrice(approxInr)} off` : 'Redeem at checkout'}
            </p>
            <div className="account-referral__wallet-actions">
              <Button asChild variant="primary" size="sm">
                <Link to="/account/cart">
                  <ShoppingBag size={14} />
                  {canRedeem ? 'Redeem' : 'Shop'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
        {!canRedeem && stats.pendingUses > 0 ? (
          <p className="account-referral__note">
            {stats.pendingUses} in progress · prepaid/partial after payment, COD on delivery
          </p>
        ) : null}

        <div className="account-referral__stats">
          <div className="account-referral__stat">
            <p className="account-referral__stat-value">{stats.completedUses || 0}</p>
            <p className="account-referral__stat-label">Completed</p>
          </div>
          <div className="account-referral__stat">
            <p className="account-referral__stat-value">{stats.pendingUses || 0}</p>
            <p className="account-referral__stat-label">In progress</p>
          </div>
          <div className="account-referral__stat">
            <p className="account-referral__stat-value">{earnedPts}</p>
            <p className="account-referral__stat-label">Earned</p>
          </div>
          <div className="account-referral__stat">
            <p className="account-referral__stat-value">{usedPts}</p>
            <p className="account-referral__stat-label">Used</p>
          </div>
        </div>
      </section>

      {code || earnedPts > 0 || usedPts > 0 || ledgerFailed ? (
        <div className="account-panel account-referral__panel">
          <div className="account-panel__header">
            <div>
              <p className="heading-sm text-accent">History</p>
              <h3 className="display-md">Points earned & used</h3>
            </div>
          </div>
          {ledgerFailed ? (
            <p className="body-sm text-muted">
              Could not load point history right now.{' '}
              <button type="button" className="account-referral__inline-retry" onClick={() => refetch()}>
                Retry
              </button>
            </p>
          ) : ledgerItems.length > 0 ? (
            <ul className="account-referral__activity">
              {ledgerItems.map((row, index) => {
                const pts = Number(row.points) || 0
                const positive = pts > 0
                return (
                  <li key={ledgerRowKey(row, index)} className="account-referral__activity-row">
                    <div>
                      <p className="account-referral__activity-order">{ledgerLabel(row)}</p>
                      <p className="body-sm text-muted">{ledgerDetail(row)}</p>
                      {row.rupeeValue > 0 ? (
                        <p className="body-sm text-muted">
                          {positive ? '' : '−'}
                          {formatPrice(row.rupeeValue)}
                        </p>
                      ) : null}
                    </div>
                    <p className={`account-referral__activity-pts${positive ? ' is-plus' : ' is-minus'}`}>
                      {positive ? '+' : ''}
                      {pts.toLocaleString('en-IN')}
                    </p>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="body-sm text-muted">
              No point history yet. Referral rewards and checkout redemptions will show here.
            </p>
          )}
        </div>
      ) : null}

      <div className="account-panel account-referral__panel">
        <div className="account-panel__header">
          <div>
            <p className="heading-sm text-accent">Rules</p>
            <h3 className="display-md">Referral Code Rules</h3>
          </div>
        </div>
        <ul className="account-referral__rules">
          <li>Your referral code never changes. Share it with as many friends as you want.</li>
          <li>Each friend can use any one referral code, only once.</li>
          <li>You cannot use your own referral code.</li>
          <li>
            You earn points after a friend pays prepaid or partial at checkout, or when their COD order is
            delivered. If that order is returned or RTO refunded, those points are reversed.
          </li>
          <li>Redeem your points at checkout as an order discount.</li>
          <li>This page shows how many points you earned and how many you used.</li>
        </ul>
        {data?.alreadyUsedAsReferee ? (
          <p className="body-sm text-muted" style={{ marginTop: 12 }}>
            You have already used a referral on an order, so another referral code will not apply at checkout.
          </p>
        ) : null}
      </div>
    </div>
  )
}
