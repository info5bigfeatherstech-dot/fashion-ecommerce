import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { createAdminCoupon, updateAdminCoupon } from '@/features/admin/api/marketing'

const EMPTY = {
  code: '',
  name: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscountAmount: '',
  minOrderValue: '0',
  usageLimit: '',
  perUserLimit: '1',
  expiryDate: '',
  isActive: true,
}

function toDateInputValue(date) {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export function AdminCouponModal({ open, onOpenChange, coupon, onSaved }) {
  const isEdit = Boolean(coupon?._id || coupon?.id)
  const [values, setValues] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (coupon) {
      setValues({
        code: coupon.code || '',
        name: coupon.name || '',
        description: coupon.description || '',
        discountType: coupon.discountType || 'percentage',
        discountValue: String(coupon.discountValue ?? coupon.discount ?? ''),
        maxDiscountAmount: coupon.maxDiscountAmount != null ? String(coupon.maxDiscountAmount) : '',
        minOrderValue: String(coupon.minOrderValue ?? 0),
        usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : '',
        perUserLimit: String(coupon.perUserLimit ?? 1),
        expiryDate: toDateInputValue(coupon.expiryDate),
        isActive: coupon.isActive !== false,
      })
    } else {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 30)
      setValues({ ...EMPTY, expiryDate: toDateInputValue(tomorrow) })
    }
  }, [open, coupon])

  const set = (key, val) => setValues((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!values.code.trim() || !values.name.trim() || !values.discountValue) {
      toast.error('Code, name, and discount value are required')
      return
    }
    setSaving(true)
    try {
      const body = {
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        description: values.description.trim(),
        discountType: values.discountType,
        discountValue: Number(values.discountValue),
        maxDiscountAmount: values.maxDiscountAmount ? Number(values.maxDiscountAmount) : null,
        minOrderValue: Number(values.minOrderValue) || 0,
        usageLimit: values.usageLimit ? Number(values.usageLimit) : null,
        perUserLimit: Number(values.perUserLimit) || 1,
        expiryDate: values.expiryDate ? new Date(values.expiryDate).toISOString() : null,
        isActive: values.isActive,
        applicableUsers: ['user', 'wholesaler'],
      }
      if (isEdit) {
        await updateAdminCoupon(coupon._id || coupon.id, body)
        toast.success('Coupon updated')
      } else {
        await createAdminCoupon(body)
        toast.success('Coupon created')
      }
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      toast.error(err?.message || 'Could not save coupon')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit coupon' : 'Create coupon'}
      className="modal-content--wide"
    >
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-row">
          <InputGroup label="Coupon code *">
            <Input
              value={values.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              placeholder="WELCOME20"
              disabled={isEdit}
            />
          </InputGroup>
          <InputGroup label="Coupon name *">
            <Input value={values.name} onChange={(e) => set('name', e.target.value)} placeholder="Welcome discount" />
          </InputGroup>
        </div>
        <InputGroup label="Description">
          <Input value={values.description} onChange={(e) => set('description', e.target.value)} placeholder="Brief description" />
        </InputGroup>
        <div className="admin-form-row">
          <InputGroup label="Discount type">
            <select className="input" value={values.discountType} onChange={(e) => set('discountType', e.target.value)}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </InputGroup>
          <InputGroup label="Discount value *">
            <Input
              type="number"
              min="0"
              value={values.discountValue}
              onChange={(e) => set('discountValue', e.target.value)}
            />
          </InputGroup>
        </div>
        <div className="admin-form-row">
          <InputGroup label="Max discount (₹)">
            <Input type="number" min="0" value={values.maxDiscountAmount} onChange={(e) => set('maxDiscountAmount', e.target.value)} />
          </InputGroup>
          <InputGroup label="Min order value (₹)">
            <Input type="number" min="0" value={values.minOrderValue} onChange={(e) => set('minOrderValue', e.target.value)} />
          </InputGroup>
        </div>
        <div className="admin-form-row">
          <InputGroup label="Usage limit">
            <Input type="number" min="0" value={values.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} placeholder="Unlimited" />
          </InputGroup>
          <InputGroup label="Per user limit">
            <Input type="number" min="1" value={values.perUserLimit} onChange={(e) => set('perUserLimit', e.target.value)} />
          </InputGroup>
          <InputGroup label="Expiry date *">
            <Input type="date" value={values.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />
          </InputGroup>
        </div>
        <label className="admin-field admin-field--checkbox">
          <input type="checkbox" checked={values.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          Active
        </label>
        <div className="admin-form-actions">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update coupon' : 'Create coupon'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
