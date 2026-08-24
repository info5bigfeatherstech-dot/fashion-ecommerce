import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { createAdminFreeShippingOffer, updateAdminFreeShippingOffer } from '@/features/admin/api/freeShippingOffers'

const EMPTY = {
  name: '',
  description: '',
  minCartValue: '599',
  endDate: '',
  isActive: true,
}

function toDateInputValue(date) {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export function AdminFreeShippingOfferModal({ open, onOpenChange, offer, onSaved }) {
  const isEdit = Boolean(offer?._id || offer?.id)
  const [values, setValues] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (offer) {
      setValues({
        name: offer.name || '',
        description: offer.description || '',
        minCartValue: String(offer.minCartValue ?? ''),
        endDate: offer.endDate ? toDateInputValue(offer.endDate) : '',
        isActive: offer.isActive !== false,
      })
      return
    }
    setValues({ ...EMPTY, minCartValue: EMPTY.minCartValue })
  }, [open, offer])

  const set = (key, val) => setValues((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = String(values.name || '').trim()
    const minCartValue = Number(values.minCartValue)
    if (!name) {
      toast.error('Offer name is required')
      return
    }
    if (!Number.isFinite(minCartValue) || minCartValue <= 0) {
      toast.error('Min cart value must be greater than 0')
      return
    }

    setSaving(true)
    try {
      const body = {
        name,
        description: String(values.description || '').trim(),
        minCartValue,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
        isActive: Boolean(values.isActive),
      }

      if (isEdit) {
        await updateAdminFreeShippingOffer(offer._id || offer.id, body)
        toast.success('Offer updated')
      } else {
        await createAdminFreeShippingOffer(body)
        toast.success('Offer created')
      }

      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      toast.error(err?.message || 'Could not save offer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit free shipping offer' : 'Create free shipping offer'}
      className="modal-content--wide"
    >
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-row">
          <InputGroup label="Offer name *">
            <Input value={values.name} onChange={(e) => set('name', e.target.value)} placeholder="Free Shipping ₹599+" />
          </InputGroup>
          <InputGroup label="Min cart value (₹) *">
            <Input
              type="number"
              min="0"
              value={values.minCartValue}
              onChange={(e) => set('minCartValue', e.target.value)}
            />
          </InputGroup>
        </div>

        <InputGroup label="Description">
          <Input
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Optional"
          />
        </InputGroup>

        <div className="admin-form-row">
          <InputGroup label="Auto-expiry date (optional)">
            <Input type="date" value={values.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </InputGroup>
          <label className="admin-field admin-field--checkbox">
            <input type="checkbox" checked={values.isActive} onChange={(e) => set('isActive', e.target.checked)} />
            Active
          </label>
        </div>

        <div className="admin-form-actions">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update offer' : 'Create offer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

