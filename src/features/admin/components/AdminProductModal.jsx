import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { buildProductFormData, createAdminProduct, updateAdminProduct } from '@/features/admin/api/products'

const EMPTY = {
  name: '',
  title: '',
  description: '',
  category: '',
  brand: 'Generic',
  ProductCode: '',
  basePrice: '',
  salePrice: '',
  quantity: '0',
  lowStockThreshold: '5',
  status: 'active',
  isFeatured: false,
  hsnCode: '',
  taxRate: '',
  weight: '',
  imageFile: null,
}

export function AdminProductModal({ open, onOpenChange, product, categories = [], onSaved }) {
  const isEdit = Boolean(product?.slug)
  const [values, setValues] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (product) {
      const v0 = product.variants?.[0] || {}
      setValues({
        name: product.name || '',
        title: product.title || '',
        description: product.description || '',
        category: typeof product.category === 'object' ? (product.category._id || product.category.id || '') : (product.category || ''),
        brand: product.brand || 'Generic',
        ProductCode: v0.productCode || v0.sku || '',
        basePrice: String(v0.price?.base ?? product.basePrice ?? ''),
        salePrice: v0.price?.sale != null ? String(v0.price.sale) : '',
        quantity: String(v0.inventory?.quantity ?? product.stock ?? 0),
        lowStockThreshold: String(v0.inventory?.lowStockThreshold ?? 5),
        status: product.status || 'active',
        isFeatured: Boolean(product.isFeatured),
        hsnCode: product.hsnCode || '',
        taxRate: product.gstRate ?? product.taxRate ?? '',
        weight: String(product.shipping?.weight ?? ''),
        imageFile: null,
      })
    } else {
      setValues(EMPTY)
    }
  }, [open, product])

  const set = (key, val) => setValues((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = buildProductFormData(values, { isEdit })
      if (isEdit) {
        await updateAdminProduct(product.slug, fd)
        toast.success('Product updated')
      } else {
        await createAdminProduct(fd)
        toast.success('Product created')
      }
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      toast.error(err?.message || 'Could not save product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit product' : 'Add product'}
      className="modal-content--wide"
    >
      <form className="admin-form-stack" onSubmit={handleSubmit}>
        <InputGroup label="Name" required>
          <Input value={values.name} onChange={(e) => set('name', e.target.value)} required />
        </InputGroup>
        <InputGroup label="Title">
          <Input value={values.title} onChange={(e) => set('title', e.target.value)} />
        </InputGroup>
        <label className="admin-field">
          <span>Description</span>
          <textarea
            className="input"
            rows={3}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </label>
        <label className="admin-field">
          <span>Category</span>
          <select
            className="input"
            value={values.category}
            onChange={(e) => set('category', e.target.value)}
            required
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat._id || cat.id} value={cat._id || cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
        {!isEdit && (
          <InputGroup label="Product code (BASE-N)" required>
            <Input
              value={values.ProductCode}
              onChange={(e) => set('ProductCode', e.target.value.toUpperCase())}
              placeholder="3897-1"
              required
            />
          </InputGroup>
        )}
        <div className="admin-form-row">
          <InputGroup label="Base price (₹)" required>
            <Input type="number" min="0" step="0.01" value={values.basePrice} onChange={(e) => set('basePrice', e.target.value)} required />
          </InputGroup>
          <InputGroup label="Sale price (₹)">
            <Input type="number" min="0" step="0.01" value={values.salePrice} onChange={(e) => set('salePrice', e.target.value)} />
          </InputGroup>
        </div>
        <div className="admin-form-row">
          <InputGroup label="Stock qty">
            <Input type="number" min="0" value={values.quantity} onChange={(e) => set('quantity', e.target.value)} />
          </InputGroup>
          <InputGroup label="Low stock at">
            <Input type="number" min="0" value={values.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} />
          </InputGroup>
        </div>
        <label className="admin-field">
          <span>Status</span>
          <select className="input" value={values.status} onChange={(e) => set('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
        </label>
        <label className="admin-toggle">
          <input type="checkbox" checked={values.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
          Featured product
        </label>
        {!isEdit && (
          <label className="admin-field">
            <span>Product image</span>
            <input type="file" accept="image/*" onChange={(e) => set('imageFile', e.target.files?.[0] || null)} />
          </label>
        )}
        <div className="admin-row-actions">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
