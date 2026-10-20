import { useMemo, useState } from 'react'
import {
  Check,
  Copy,
  Gift,
  Loader2,
  RefreshCw,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { SITE_NAME } from '@/config/site'
import { useGenerateReferral, useMyReferral } from '@/features/referral/hooks'
import { buildReferralShareText, referralDiscountLabel } from '@/features/referral/utils'

function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.628 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

export function AccountReferralTab() {
  const { data, isLoading, isError, error, refetch } = useMyReferral()
  const generate = useGenerateReferral()
  const [copied, setCopied] = useState(false)

  const settings = data?.settings
  const enabled = Boolean(settings?.enabled)
  const code = data?.code?.code || ''
  const stats = data?.stats || { completedUses: 0, pendingUses: 0, pointsAwarded: 0 }
  const discountLabel = referralDiscountLabel(settings)
  const rewardPoints = Math.max(0, Math.floor(Number(settings?.rewardPoints) || 0))
  const minOrder = Number(settings?.minOrderValue) || 0
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

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
      <div className="account-referral__hero">
        <p className="account-referral__eyebrow">Share & earn</p>
        <p className="account-referral__lead">
          Friends get {discountLabel} on their order. After they complete it, you get{' '}
          <strong>{rewardPoints}</strong> loyalty points in your wallet.
        </p>
        {minOrder > 0 ? (
          <p className="body-sm text-muted">
            Minimum bag value to use a referral: ₹{minOrder.toLocaleString('en-IN')}
          </p>
        ) : null}

        {code ? (
          <>
            <div className="account-referral__code-row">
              <span className="account-referral__code">{code}</span>
              <Button type="button" variant="secondary" size="sm" onClick={copyCode}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div className="account-referral__share">
              <Button type="button" variant="primary" size="sm" onClick={shareWhatsApp}>
                <WhatsAppIcon /> WhatsApp
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={shareNative}>
                <Share2 size={14} /> Share
              </Button>
            </div>
          </>
        ) : (
          <div className="account-referral__generate">
            <p className="body-sm text-muted">
              Generate your unique code once. You can share it with as many people as you like.
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={handleGenerate}
              disabled={generate.isPending || !enabled}
            >
              {generate.isPending ? <Loader2 size={14} className="account-spin" /> : <Gift size={14} />}
              {generate.isPending ? 'Generating…' : 'Generate my code'}
            </Button>
          </div>
        )}
      </div>

      <div className="account-referral__stats">
        <div className="account-referral__stat">
          <p className="account-referral__stat-value">{stats.completedUses || 0}</p>
          <p className="account-referral__stat-label">Completed orders</p>
        </div>
        <div className="account-referral__stat">
          <p className="account-referral__stat-value">{stats.pendingUses || 0}</p>
          <p className="account-referral__stat-label">In progress</p>
        </div>
        <div className="account-referral__stat">
          <p className="account-referral__stat-value">{stats.pointsAwarded || 0}</p>
          <p className="account-referral__stat-label">Points earned</p>
        </div>
      </div>

      <div className="account-panel">
        <div className="account-panel__header">
          <div>
            <p className="heading-sm text-accent">How it works</p>
            <h3 className="display-md">Referral rules</h3>
          </div>
        </div>
        <ul className="account-referral__rules">
          <li>Your code never changes. Share it with as many friends as you want.</li>
          <li>Each friend can use any one referral code, only once.</li>
          <li>You cannot use your own code.</li>
          <li>Checkout allows one offer at a time: coupon or referral, not both. Loyalty points still work separately.</li>
          <li>
            Points credit to your loyalty wallet after a referred order is complete (paid, or COD delivered).
            RTO / return reverses those points.
          </li>
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
