import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { recomputeAdminLoyaltyUser } from '@/features/admin/api/marketing'

function formatInr(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

export function AdminLoyaltyRecomputeModal({ open, onOpenChange, onDone, initialEmail = '' }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!open) return
    setEmail(String(initialEmail || '').trim())
    setResult(null)
    setBusy(false)
  }, [open, initialEmail])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      toast.error('Enter a valid customer email')
      return
    }
    setBusy(true)
    setResult(null)
    try {
      const payload = await recomputeAdminLoyaltyUser({ email: trimmed })
      const loyalty = payload?.loyalty || payload?.data?.loyalty || null
      const stats = payload?.stats || payload?.data?.stats || null
      setResult({
        email: payload?.email || trimmed,
        loyalty,
        stats,
      })
      const badgeName = loyalty?.badge?.name || loyalty?.badge?.slug
      if (badgeName) {
        toast.success(`Assigned: ${badgeName}`)
      } else {
        toast.success('Loyalty refreshed (no matching badge yet)')
      }
      onDone?.()
    } catch (err) {
      toast.error(err?.message || 'Recompute failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Recompute customer loyalty">
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
        <p className="body-sm text-muted" style={{ margin: 0 }}>
          Use when a paid/delivered order did not assign a badge. Recalculates lifetime spend from
          qualifying orders and assigns the best matching active badge.
        </p>

        <InputGroup label="Customer email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="customer@email.com"
            autoComplete="off"
            disabled={busy}
            required
          />
        </InputGroup>

        {result && (
          <div
            className="admin-card"
            style={{ padding: 12, display: 'grid', gap: 6, fontSize: 13 }}
          >
            <div>
              <strong>{result.email}</strong>
            </div>
            <div className="text-muted">
              Spend {formatInr(result.stats?.lifetimeSpendInr ?? result.loyalty?.lifetimeSpendInr)}
              {' · '}
              {Number(result.stats?.lifetimeOrderCount ?? result.loyalty?.lifetimeOrderCount) || 0}{' '}
              qualifying orders
            </div>
            <div>
              Badge:{' '}
              <strong>
                {result.loyalty?.badge?.name || result.loyalty?.badge?.slug || 'None'}
              </strong>
            </div>
          </div>
        )}

        <div className="admin-form-actions">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Close
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? 'Recomputing…' : 'Recompute'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
