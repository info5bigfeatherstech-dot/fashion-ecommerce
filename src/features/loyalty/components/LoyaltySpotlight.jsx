import { Link } from 'react-router-dom'
import { Gift, Sparkles, Truck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMemberStatus } from '../hooks'
import { LOYALTY_TIERS } from '@/config/site'

export function LoyaltySpotlight({ compact = false }) {
  const { data, isLoading } = useMemberStatus()

  if (isLoading) {
    return (
      <div className="loyalty-spotlight">
        <Skeleton className="skeleton--title" />
        <Skeleton className="skeleton--text" />
      </div>
    )
  }

  if (compact) {
    return (
      <Link to="/loyalty" className="points-badge">
        <Sparkles size={12} />
        {data?.isMember ? `${data.points} pts` : 'Join VERAÒ Circle'}
      </Link>
    )
  }

  return (
    <div className="loyalty-spotlight">
      <div>
        <p className="heading-sm" style={{ color: 'var(--color-border)', marginBottom: 'var(--space-1)' }}>
          VERAÒ Circle
        </p>
        <h2 className="display-md" style={{ marginBottom: 'var(--space-2)' }}>
          {data?.isMember ? `Welcome back, ${data.tier}` : 'Rewards That Move With You'}
        </h2>
        {data?.isMember ? (
          <p className="loyalty-spotlight__points">{data.points.toLocaleString()} points</p>
        ) : (
          <p className="body-lg" style={{ opacity: 0.85, maxWidth: '48ch' }}>
            Earn points on every purchase. Unlock exclusive drops, free shipping, and birthday rewards.
          </p>
        )}
        <div className="loyalty-spotlight__benefits" style={{ marginTop: 'var(--space-3)' }}>
          <span className="loyalty-spotlight__benefit"><Gift size={16} /> Birthday gift</span>
          <span className="loyalty-spotlight__benefit"><Truck size={16} /> Free shipping tiers</span>
          <span className="loyalty-spotlight__benefit"><Sparkles size={16} /> Early access</span>
        </div>
      </div>
      <div>
        {!data?.isMember && (
          <Link to="/loyalty">
            <Button variant="accent" size="lg">Join Free</Button>
          </Link>
        )}
        {data?.isMember && data.pointsToNext > 0 && (
          <p className="body-sm" style={{ opacity: 0.7 }}>
            {data.pointsToNext} points to {data.nextTier}
          </p>
        )}
      </div>
    </div>
  )
}

export function PointsBadge() {
  const { data } = useMemberStatus()
  if (!data?.isMember) return null
  return (
    <span className="points-badge">
      <Sparkles size={12} />
      {data.points} pts
    </span>
  )
}
