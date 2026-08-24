import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { stopLenis, startLenis } from '@/lib/lenis'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import ProductFormBody from '@/features/admin/components/product-form/ProductFormBody'
import VariantModal, { defaultVariant } from '@/features/admin/components/product-form/VariantModal'
import { BrandModal } from '@/features/admin/components/product-form/BrandModal'
import { CategoryQuickModal } from '@/features/admin/components/product-form/CategoryQuickModal'
import AttributeModal from '@/features/admin/components/product-form/AttributeModal'
import CustomMessageModal from '@/features/admin/components/product-form/CustomMessageModal'
import {
  emptyProductForm,
  formatIndianRupee,
  getDiscountPercentage,
  validateCreateProductForm,
} from '@/features/admin/components/product-form/utils'
import { shippingFormFromVariant } from '@/lib/variantCatalogForm'
import {
  buildCreateProductFormData,
  buildProductFormData,
  createAdminProduct,
  updateAdminProduct,
} from '@/features/admin/api/products'

const SIMPLE_EMPTY = {
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

function SimpleEditForm({ product, categories, onOpenChange, onSaved }) {
  const [values, setValues] = useState(SIMPLE_EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!product) return
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
  }, [product])

  const set = (key, val) => setValues((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const fd = buildProductFormData(values, { isEdit: true })
      await updateAdminProduct(product.slug, fd)
      toast.success('Product updated')
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      const message = err?.message || 'Could not save product'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="product-modal-form" onSubmit={handleSubmit}>
      {error ? <div className="product-modal-error mx-6 mt-4" role="alert">{error}</div> : null}
      <div className="product-modal-form__body">
        <InputGroup label="Name" required>
          <Input value={values.name} onChange={(e) => set('name', e.target.value)} required />
        </InputGroup>
        <InputGroup label="Title">
          <Input value={values.title} onChange={(e) => set('title', e.target.value)} />
        </InputGroup>
        <InputGroup label="Description">
          <textarea className="input product-modal-textarea" rows={3} value={values.description} onChange={(e) => set('description', e.target.value)} />
        </InputGroup>
        <InputGroup label="Category" required>
          <select className="input" value={values.category} onChange={(e) => set('category', e.target.value)} required>
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.name}</option>
            ))}
          </select>
        </InputGroup>
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
      </div>
      <div className="product-modal-form__footer">
        <Button type="button" variant="secondary" fullWidth disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button type="submit" variant="primary" fullWidth disabled={saving} className="product-modal-submit">
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

export function AdminProductModal({
  open,
  onOpenChange,
  product,
  categories: categoriesProp = [],
  products = [],
  onSaved,
  onCategoriesChange,
}) {
  const isEdit = Boolean(product?.slug)
  const [categories, setCategories] = useState(categoriesProp)
  const [brands, setBrands] = useState(['Generic'])
  const [formData, setFormData] = useState(emptyProductForm)
  const [variantForm, setVariantForm] = useState(defaultVariant)
  const [editingVariantIndex, setEditingVariantIndex] = useState(null)
  const [editingAttribute, setEditingAttribute] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [showAttributeModal, setShowAttributeModal] = useState(false)
  const [showCustomMessageModal, setShowCustomMessageModal] = useState(false)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setCategories(categoriesProp)
  }, [categoriesProp])

  useEffect(() => {
    const fromProducts = [...new Set(products.map((p) => p.brand).filter(Boolean))]
    setBrands([...new Set(['Generic', ...fromProducts])].sort())
  }, [products])

  useEffect(() => {
    if (!open) return
    setError('')
    if (!isEdit) setFormData(emptyProductForm())
  }, [open, isEdit])

  useEffect(() => {
    if (!open) {
      startLenis()
      document.documentElement.classList.remove('modal-open')
      return undefined
    }
    stopLenis()
    document.documentElement.classList.add('modal-open')
    return () => {
      startLenis()
      document.documentElement.classList.remove('modal-open')
    }
  }, [open])

  const openAddVariant = () => {
    setVariantForm(defaultVariant)
    setEditingVariantIndex(null)
    setShowVariantModal(true)
  }

  const openEditVariant = (index) => {
    const v = formData.variants[index]
    setVariantForm({
      ProductCode: v.ProductCode != null ? String(v.ProductCode) : '',
      attributes: v.attributes?.length > 0 ? v.attributes : [{ key: '', value: '' }],
      price: { base: v.price?.base ?? '', sale: v.price?.sale ?? '', wholesaleBase: v.price?.wholesaleBase ?? v.wholesaleBase ?? '', wholesaleSale: v.price?.wholesaleSale ?? v.wholesaleSale ?? '' },
      inventory: { ...v.inventory },
      images: v.images || [],
      isActive: v.isActive !== false,
      wholesale: v.wholesale || false,
      wholesaleBase: v.wholesaleBase || v.price?.wholesaleBase || '',
      wholesaleSale: v.wholesaleSale || v.price?.wholesaleSale || '',
      minimumOrderQuantity: v.minimumOrderQuantity || 1,
      channelVisibility: v.channelVisibility || { ecomm: 'active', wholesale: 'draft' },
      title: v.title || '',
      description: v.description || '',
      shipping: shippingFormFromVariant(v, formData.shipping, formData),
    })
    setEditingVariantIndex(index)
    setShowVariantModal(true)
  }

  const handleVariantSave = (variantToSave) => {
    if (editingVariantIndex !== null) {
      setFormData((p) => ({
        ...p,
        variants: p.variants.map((v, i) => (i === editingVariantIndex ? variantToSave : v)),
      }))
    } else {
      setFormData((p) => ({ ...p, variants: [...p.variants, variantToSave] }))
    }
    setShowVariantModal(false)
    setVariantForm(defaultVariant)
    setEditingVariantIndex(null)
  }

  const deleteVariant = (index) => setFormData((p) => ({ ...p, variants: p.variants.filter((_, i) => i !== index) }))
  const toggleVariantActive = (index) =>
    setFormData((p) => ({
      ...p,
      variants: p.variants.map((v, i) => (i === index ? { ...v, isActive: !v.isActive } : v)),
    }))

  const handleAddAttribute = (attr) => {
    if (editingAttribute) {
      setFormData((p) => ({
        ...p,
        attributes: p.attributes.map((a) => (a.id === attr.id ? attr : a)),
      }))
      setEditingAttribute(null)
    } else {
      setFormData((p) => ({ ...p, attributes: [...p.attributes, attr] }))
    }
  }

  const removeAttribute = (id) => setFormData((p) => ({ ...p, attributes: p.attributes.filter((a) => a.id !== id) }))

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      validateCreateProductForm(formData)
    } catch (err) {
      setError(err.message)
      return
    }
    setSaving(true)
    try {
      const fd = buildCreateProductFormData(formData)
      await createAdminProduct(fd)
      toast.success('Product created')
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      const message = err?.message || 'Could not create product'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const modalClass = isEdit ? 'modal-content--product' : 'modal-content--product-full'
  const title = isEdit ? 'Edit product' : 'Create New Product'
  const subtitle = isEdit
    ? undefined
    : 'Top fields = main variant (variants[0]) · "Add Variant" = extra variants'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className={`modal-content ${modalClass}`} data-lenis-prevent onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
          <div className="product-modal-shell">
            <div className="modal-header">
              <div className="modal-header__text">
                <Dialog.Title className="modal-title">{title}</Dialog.Title>
                {subtitle ? <p className="modal-subtitle">{subtitle}</p> : null}
              </div>
              <Dialog.Close asChild>
                <button type="button" className="btn btn--ghost btn--icon" aria-label="Close" disabled={saving}>
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            {isEdit ? (
              <SimpleEditForm product={product} categories={categories} onOpenChange={onOpenChange} onSaved={onSaved} />
            ) : (
              <>
                {error ? <div className="product-modal-error" role="alert">{error}</div> : null}
                <form className="product-modal-form" onSubmit={handleCreateSubmit}>
                  <div className="product-modal-form__body product-modal-form__body--wide">
                    <ProductFormBody
                      formData={formData}
                      setFormData={setFormData}
                      categories={categories}
                      brands={brands}
                      onOpenCategoryModal={() => setShowCategoryModal(true)}
                      onOpenBrandModal={() => setShowBrandModal(true)}
                      onOpenAttributeModal={() => {
                        setEditingAttribute(null)
                        setShowAttributeModal(true)
                      }}
                      onEditAttribute={(attr) => {
                        setEditingAttribute(attr)
                        setShowAttributeModal(true)
                      }}
                      onOpenCustomMessage={() => setShowCustomMessageModal(true)}
                      onOpenAddVariant={openAddVariant}
                      onOpenEditVariant={openEditVariant}
                      onRemoveAttribute={removeAttribute}
                      onDeleteVariant={deleteVariant}
                      onToggleVariantActive={toggleVariantActive}
                      formatIndianRupee={formatIndianRupee}
                      getDiscountPercentage={getDiscountPercentage}
                    />
                  </div>
                  <div className="product-modal-form__footer">
                    <Button type="button" variant="secondary" fullWidth disabled={saving} onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" fullWidth disabled={saving} className="product-modal-submit">
                      {saving ? 'Creating…' : 'Create Product'}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>

          {showCategoryModal ? (
            <CategoryQuickModal
              onSelect={(catId) => setFormData((p) => ({ ...p, category: catId }))}
              onCreated={(category) => {
                setCategories((prev) => [...prev, category])
                onCategoriesChange?.()
              }}
              onClose={() => setShowCategoryModal(false)}
            />
          ) : null}
          {showBrandModal ? (
            <BrandModal
              brands={brands}
              setBrands={setBrands}
              onSelect={(brand) => setFormData((p) => ({ ...p, brand }))}
              onClose={() => setShowBrandModal(false)}
            />
          ) : null}
          {showAttributeModal ? (
            <AttributeModal
              initialValue={editingAttribute}
              onAdd={handleAddAttribute}
              onClose={() => {
                setShowAttributeModal(false)
                setEditingAttribute(null)
              }}
            />
          ) : null}
          {showCustomMessageModal ? (
            <CustomMessageModal
              currentMessage={formData.fomo.customMessage}
              onSave={(msg) => setFormData((p) => ({ ...p, fomo: { ...p.fomo, customMessage: msg } }))}
              onClose={() => setShowCustomMessageModal(false)}
            />
          ) : null}
          {showVariantModal ? (
            <VariantModal
              variantForm={variantForm}
              setVariantForm={setVariantForm}
              editingVariantIndex={editingVariantIndex}
              onSave={handleVariantSave}
              onClose={() => {
                setShowVariantModal(false)
                setVariantForm(defaultVariant)
                setEditingVariantIndex(null)
              }}
              getDiscountPercentage={getDiscountPercentage}
            />
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
