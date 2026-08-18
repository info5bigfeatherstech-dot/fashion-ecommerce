import { Link } from 'react-router-dom'
import { Gift, Sparkles, Truck, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMemberStatus, useRewards } from '@/features/loyalty/hooks'
import { LOYALTY_TIERS } from '@/config/site'
import { useAppStore } from '@/store'

export default function Loyalty() {
  const { data: status, isLoading: statusLoading } = useMemberStatus()
  const { data: rewards, isLoading: rewardsLoading } = useRewards()
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-6)' }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', marginInline: 'auto', marginBottom: 'var(--space-8)' }}>
        <p className="heading-sm text-accent">VERAÒ Circle</p>
        <h1 className="display-lg" style={{ marginBlock: 'var(--space-2)' }}>
          Rewards That Move With You
        </h1>
        <p className="body-lg text-muted">
          Earn points on every purchase. Unlock tiers, exclusive drops, and member-only rewards.
        </p>
      </div>

      {statusLoading ? (
        <Skeleton style={{ height: '200px', marginBottom: 'var(--space-6)' }} />
      ) : status?.isMember ? (
        <div className="loyalty-spotlight" style={{ marginBottom: 'var(--space-6)' }}>
          <div>
            <p className="heading-sm" style={{ color: 'var(--color-border)' }}>Your Status</p>
            <h2 className="display-md">{status.tier} Member</h2>
            <p className="loyalty-spotlight__points">{status.points.toLocaleString()} points</p>
            {status.pointsToNext > 0 && (
              <p className="body-sm" style={{ opacity: 0.7, marginTop: 'var(--space-1)' }}>
                {status.pointsToNext} points until {status.nextTier}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="loyalty-join">
          <Link to={isAuthenticated ? '/account' : '/account'}>
            <Button variant="accent" size="lg">Join VERAÒ Circle — It's Free</Button>
          </Link>
        </div>
      )}

      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h2 className="display-md" style={{ marginBottom: 'var(--space-4)' }}>Membership Tiers</h2>
        <div className="grid-3">
          {LOYALTY_TIERS.map((tier) => (
            <div key={tier.name} className="card" style={{ padding: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
                <Star size={18} style={{ color: 'var(--color-accent)' }} />
                <h3 className="display-md" style={{ fontSize: 'var(--text-xl)' }}>{tier.name}</h3>
              </div>
              <p className="body-sm text-muted" style={{ marginBottom: 'var(--space-2)' }}>
                From {tier.minPoints.toLocaleString()} points
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {tier.benefits.map((b) => (
                  <li key={b} className="body-sm" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <Sparkles size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="display-md" style={{ marginBottom: 'var(--space-4)' }}>Redeem Rewards</h2>
        {rewardsLoading ? (
          <div className="grid-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} style={{ height: '120px' }} />
            ))}
          </div>
        ) : (
          <div className="grid-3">
            {rewards?.map((reward) => (
              <div key={reward.id} className="deal-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <Gift size={16} style={{ color: 'var(--color-accent)' }} />
                  <p className="deal-card__tag">{reward.pointsCost === 0 ? 'Complimentary' : `${reward.pointsCost} pts`}</p>
                </div>
                <h3 className="deal-card__title">{reward.title}</h3>
                <p className="body-sm text-muted">{reward.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 'var(--space-8)' }}>
        <div className="trust-strip" style={{ border: 'none' }}>
          <div className="trust-strip__item">
            <Sparkles size={24} className="trust-strip__icon" />
            <p className="trust-strip__title">Earn Points</p>
            <p className="trust-strip__desc">1–2 pts per $1 spent</p>
          </div>
          <div className="trust-strip__item">
            <Gift size={24} className="trust-strip__icon" />
            <p className="trust-strip__title">Redeem Rewards</p>
            <p className="trust-strip__desc">Discounts, gifts & exclusives</p>
          </div>
          <div className="trust-strip__item">
            <Truck size={24} className="trust-strip__icon" />
            <p className="trust-strip__title">Free Shipping</p>
            <p className="trust-strip__desc">At Insider tier & above</p>
          </div>
        </div>
      </section>
    </div>
  )
}
