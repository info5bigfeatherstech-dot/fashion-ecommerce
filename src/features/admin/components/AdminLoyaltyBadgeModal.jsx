import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { createAdminLoyaltyBadge, updateAdminLoyaltyBadge } from '@/features/admin/api/marketing'

const CRITERIA_MODES = [
  { value: 'spend', label: 'Lifetime spend (₹)' },
  { value: 'orders', label: 'Order count' },
  { value: 'spend_and_orders', label: 'Spend AND orders' },
  { value: 'spend_or_orders', label: 'Spend OR orders' },
]

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  criteriaMode: 'spend',
  minLifetimeSpendInr: '0',
  minOrderCount: '0',
  rank: '3',
  color: '#C9A227',
  maxMembers: '',
  isActive: true,
}

function slugify(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function AdminLoyaltyBadgeModal({ open, onOpenChange, badge, onSaved }) {
  const isEdit = Boolean(badge?._id || badge?.id)
  const [values, setValues] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setSlugTouched(false)
    if (badge) {
      setValues({
        name: badge.name || '',
        slug: badge.slug || '',
        description: badge.description || '',
        criteriaMode: badge.criteriaMode || 'spend',
        minLifetimeSpendInr: String(badge.minLifetimeSpendInr ?? 0),
        minOrderCount: String(badge.minOrderCount ?? 0),
        rank: String(badge.rank ?? 3),
        color: badge.color || '#C9A227',
        maxMembers: badge.maxMembers != null && badge.maxMembers > 0 ? String(badge.maxMembers) : '',
        isActive: badge.isActive !== false,
      })
    } else {
      setValues({ ...EMPTY })
    }
  }, [open, badge])

  const set = (key, val) => setValues((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!values.name.trim()) {
      toast.error('Badge name is required')
      return
    }
    const slug = values.slug.trim() || slugify(values.name)
    if (!slug) {
      toast.error('Badge slug is required')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: values.name.trim(),
        slug,
        description: values.description.trim(),
        criteriaMode: values.criteriaMode,
        minLifetimeSpendInr: Number(values.minLifetimeSpendInr) || 0,
        minOrderCount: Math.max(0, Math.floor(Number(values.minOrderCount) || 0)),
        rank: Math.max(0, Math.floor(Number(values.rank) || 0)),
        color: values.color.trim() || '#C9A227',
        maxMembers: values.maxMembers.trim()
          ? Math.max(1, Math.floor(Number(values.maxMembers) || 0))
          : null,
        isActive: values.isActive,
      }
      if (isEdit) {
        await updateAdminLoyaltyBadge(badge._id || badge.id, body)
        toast.success('Badge updated')
      } else {
        await createAdminLoyaltyBadge(body)
        toast.success('Badge created')
      }
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      toast.error(err?.message || 'Could not save badge')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit loyalty badge' : 'Create loyalty badge'}
      className="modal-content--wide"
    >
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-row">
          <InputGroup label="Badge name *">
            <Input
              value={values.name}
              onChange={(e) => {
                const name = e.target.value
                set('name', name)
                if (!slugTouched && !isEdit) set('slug', slugify(name))
              }}
              placeholder="Gold"
            />
          </InputGroup>
          <InputGroup label="Slug *">
            <Input
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug', slugify(e.target.value))
              }}
              placeholder="gold"
              disabled={isEdit}
            />
          </InputGroup>
        </div>
        <InputGroup label="Description">
          <Input
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Customers with high lifetime spend"
          />
        </InputGroup>
        <div className="admin-form-row">
          <InputGroup label="Criteria">
            <select
              className="input"
              value={values.criteriaMode}
              onChange={(e) => set('criteriaMode', e.target.value)}
            >
              {CRITERIA_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </InputGroup>
          <InputGroup label="Rank (1 = best)">
            <Input
              type="number"
              min="0"
              value={values.rank}
              onChange={(e) => set('rank', e.target.value)}
            />
          </InputGroup>
        </div>
        <div className="admin-form-row">
          <InputGroup label="Min lifetime spend (₹)">
            <Input
              type="number"
              min="0"
              value={values.minLifetimeSpendInr}
              onChange={(e) => set('minLifetimeSpendInr', e.target.value)}
            />
          </InputGroup>
          <InputGroup label="Min order count">
            <Input
              type="number"
              min="0"
              value={values.minOrderCount}
              onChange={(e) => set('minOrderCount', e.target.value)}
            />
          </InputGroup>
          <InputGroup label="Color">
            <Input type="color" value={values.color} onChange={(e) => set('color', e.target.value)} />
          </InputGroup>
          <InputGroup label="Max members (optional)">
            <Input
              type="number"
              min="1"
              value={values.maxMembers}
              onChange={(e) => set('maxMembers', e.target.value)}
              placeholder="Unlimited"
            />
          </InputGroup>
        </div>
        <p className="body-sm text-muted" style={{ margin: 0 }}>
          Leave max members empty for unlimited. If set (e.g. 5), only the first {values.maxMembers || 'N'}{' '}
          customers who qualify keep this badge; others get the next lower matching tier.
        </p>
        <label className="admin-field admin-field--checkbox">
          <input type="checkbox" checked={values.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          Active
        </label>
        <p className="body-sm text-muted" style={{ margin: 0 }}>
          Best matching active badge is assigned by rank (lower number wins). Example: Gold rank 1 @
          ₹1,000, Silver rank 2 @ ₹500, Bronze rank 3 @ ₹0 — customers upgrade automatically when they
          qualify for a better tier.
        </p>
        <div className="admin-form-actions">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update badge' : 'Create badge'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
