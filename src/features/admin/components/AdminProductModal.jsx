import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { stopLenis, startLenis } from '@/lib/lenis'
import { Button } from '@/components/ui/Button'
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
  normaliseVariantsForEdit,
  productToEditForm,
  validateCreateProductForm,
} from '@/features/admin/components/product-form/utils'
import { shippingFormFromVariant } from '@/lib/variantCatalogForm'
import {
  addAdminProductVariant,
  buildCreateProductFormData,
  buildUpdateProductFormData,
  createAdminProduct,
  deleteAdminProductVariant,
  getAdminProductBySlug,
  updateAdminProduct,
  updateAdminProductVariant,
} from '@/features/admin/api/products'

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
  const [variantSaving, setVariantSaving] = useState(false)
  const [variantSaveError, setVariantSaveError] = useState(null)
  const [loadingProduct, setLoadingProduct] = useState(false)
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

    if (!isEdit) {
      setFormData(emptyProductForm())
      setLoadingProduct(false)
      return
    }

    // Hydrate immediately from list row, then refresh from full product GET.
    setFormData(productToEditForm(product))
    let cancelled = false
    const slug = product.slug

    ;(async () => {
      setLoadingProduct(true)
      try {
        const full = await getAdminProductBySlug(slug)
        if (!cancelled && full) setFormData(productToEditForm(full))
      } catch {
        // List row hydration is enough to show the form if detail fetch fails.
      } finally {
        if (!cancelled) setLoadingProduct(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, isEdit, product?.slug, product?._id])

  useEffect(() => {
    if (!open) {
      startLenis()
      document.documentElement.classList.remove('modal-open')
      // Nested popups must not survive parent close/reopen.
      setShowCategoryModal(false)
      setShowBrandModal(false)
      setShowAttributeModal(false)
      setShowCustomMessageModal(false)
      setShowVariantModal(false)
      setEditingVariantIndex(null)
      setEditingAttribute(null)
      setVariantForm(defaultVariant)
      setVariantSaveError(null)
      setError('')
      return undefined
    }
    stopLenis()
    document.documentElement.classList.add('modal-open')
    return () => {
      startLenis()
      document.documentElement.classList.remove('modal-open')
    }
  }, [open])

  const handleOpenChange = (nextOpen) => {
    // Keep product modal open while a nested popup is visible
    // (e.g. Escape / outside click should close brand first, not the editor).
    if (
      !nextOpen &&
      (showCategoryModal ||
        showBrandModal ||
        showAttributeModal ||
        showCustomMessageModal ||
        showVariantModal)
    ) {
      setShowCategoryModal(false)
      setShowBrandModal(false)
      setShowAttributeModal(false)
      setShowCustomMessageModal(false)
      setShowVariantModal(false)
      setEditingVariantIndex(null)
      setEditingAttribute(null)
      setVariantForm(defaultVariant)
      setVariantSaveError(null)
      return
    }
    if (!nextOpen) {
      setShowCategoryModal(false)
      setShowBrandModal(false)
      setShowAttributeModal(false)
      setShowCustomMessageModal(false)
      setShowVariantModal(false)
      setEditingVariantIndex(null)
      setEditingAttribute(null)
      setVariantForm(defaultVariant)
      setVariantSaveError(null)
    }
    onOpenChange(nextOpen)
  }

  const openAddVariant = () => {
    setVariantForm(defaultVariant)
    setEditingVariantIndex(null)
    setVariantSaveError(null)
    setShowVariantModal(true)
  }

  const openEditVariant = (index) => {
    if (isEdit && index === 0) return
    const v = formData.variants[index]
    if (!v) return
    setVariantForm({
      ProductCode: String(v.ProductCode ?? v.productCode ?? ''),
      attributes: v.attributes?.length > 0
        ? v.attributes.map((a) => ({ key: a.key || '', value: a.value || '', id: a.id }))
        : [{ key: '', value: '' }],
      price: {
        base: v.price?.base ?? '',
        sale: v.price?.sale ?? '',
        wholesaleBase: v.price?.wholesaleBase ?? v.wholesaleBase ?? '',
        wholesaleSale: v.price?.wholesaleSale ?? v.wholesaleSale ?? '',
      },
      inventory: {
        quantity: v.inventory?.quantity ?? 0,
        lowStockThreshold: v.inventory?.lowStockThreshold ?? 5,
        trackInventory: v.inventory?.trackInventory !== false,
      },
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
    setVariantSaveError(null)
    setShowVariantModal(true)
  }

  const closeVariantModal = () => {
    setShowVariantModal(false)
    setVariantForm(defaultVariant)
    setEditingVariantIndex(null)
    setVariantSaveError(null)
  }

  const applyProductVariants = (productPayload) => {
    if (!productPayload?.variants) return
    setFormData((prev) => ({
      ...prev,
      variants: normaliseVariantsForEdit(productPayload.variants),
    }))
  }

  const handleVariantSave = async (variantToSave) => {
    setVariantSaveError(null)

    // Create mode: product does not exist yet — keep variants in local form only.
    if (!isEdit) {
      if (editingVariantIndex !== null) {
        setFormData((p) => ({
          ...p,
          variants: p.variants.map((v, i) => (i === editingVariantIndex ? variantToSave : v)),
        }))
      } else {
        setFormData((p) => ({ ...p, variants: [...p.variants, variantToSave] }))
      }
      closeVariantModal()
      return
    }

    const slug = product?.slug
    if (!slug) {
      setVariantSaveError('Product slug is missing — cannot save variant.')
      return
    }

    const pricePayload = {
      base: parseFloat(variantToSave.price.base) || 0,
      sale: variantToSave.price.sale ? parseFloat(variantToSave.price.sale) : null,
      wholesaleBase: variantToSave.wholesale
        ? (parseFloat(variantToSave.price.wholesaleBase) || 0)
        : undefined,
      wholesaleSale: variantToSave.wholesale
        ? (variantToSave.price.wholesaleSale
          ? parseFloat(variantToSave.price.wholesaleSale)
          : null)
        : undefined,
    }
    const wholesaleVisibility =
      variantToSave.wholesale && pricePayload.wholesaleBase > 0 ? 'active' : 'draft'
    const channelVisibilityPayload = {
      ecomm: variantToSave.channelVisibility?.ecomm || 'active',
      wholesale: wholesaleVisibility,
    }

    setVariantSaving(true)
    try {
      if (editingVariantIndex !== null) {
        const existingProductCode =
          formData.variants[editingVariantIndex]?.productCode ??
          formData.variants[editingVariantIndex]?.ProductCode
        const variantUpdatePayload = {
          slug,
          barcode: existingProductCode,
          price: pricePayload,
          inventory: variantToSave.inventory,
          attributes: variantToSave.attributes,
          images: variantToSave.images,
          isActive: variantToSave.isActive,
          wholesale: variantToSave.wholesale,
          minimumOrderQuantity: variantToSave.minimumOrderQuantity,
          channelVisibility: channelVisibilityPayload,
        }
        if (editingVariantIndex > 0) {
          variantUpdatePayload.variantTitle = variantToSave.title
          variantUpdatePayload.variantDescription = variantToSave.description
          variantUpdatePayload.shipping = variantToSave.shipping
        }
        const result = await updateAdminProductVariant(variantUpdatePayload)
        applyProductVariants(result?.product)
        toast.success('Variant updated')
      } else {
        const result = await addAdminProductVariant(slug, {
          ...variantToSave,
          price: pricePayload,
          channelVisibility: channelVisibilityPayload,
        })
        applyProductVariants(result?.product)
        toast.success('Variant added')
        onSaved?.()
      }
      closeVariantModal()
    } catch (err) {
      const message = err?.message || 'Failed to save variant'
      setVariantSaveError(message)
      toast.error(message)
    } finally {
      setVariantSaving(false)
    }
  }

  const deleteVariant = async (index) => {
    if (isEdit && index === 0) {
      alert('Cannot delete the main variant. It is the product itself.')
      return
    }

    // Create mode: local list only
    if (!isEdit) {
      setFormData((p) => ({ ...p, variants: p.variants.filter((_, i) => i !== index) }))
      return
    }

    const variant = formData.variants[index]
    const barcode = variant?.productCode ?? variant?.ProductCode
    if (!barcode && barcode !== 0) {
      alert('Cannot delete — variant has no productCode')
      return
    }
    if (!window.confirm(`Delete variant (productCode: ${barcode})? This cannot be undone.`)) return

    const prevVariants = formData.variants
    setFormData((p) => ({ ...p, variants: p.variants.filter((_, i) => i !== index) }))
    try {
      const result = await deleteAdminProductVariant(product.slug, barcode)
      applyProductVariants(result?.product)
      toast.success('Variant deleted')
      onSaved?.()
    } catch (err) {
      setFormData((p) => ({ ...p, variants: prevVariants }))
      toast.error(err?.message || 'Delete failed')
    }
  }

  const toggleVariantActive = async (index) => {
    if (!isEdit) {
      setFormData((p) => ({
        ...p,
        variants: p.variants.map((v, i) => {
          if (i !== index) return v
          const nextActive = !v.isActive
          return {
            ...v,
            isActive: nextActive,
            channelVisibility: {
              ...(v.channelVisibility || { ecomm: 'active', wholesale: 'draft' }),
              ecomm: nextActive ? 'active' : 'draft',
            },
          }
        }),
      }))
      return
    }

    const variant = formData.variants[index]
    if (!variant) return
    const barcode = variant.productCode ?? variant.ProductCode
    const newActiveState = !variant.isActive
    const newEcommVisibility = newActiveState ? 'active' : 'draft'
    const prevVariants = formData.variants

    setFormData((p) => ({
      ...p,
      variants: p.variants.map((v, i) =>
        i === index
          ? {
              ...v,
              isActive: newActiveState,
              channelVisibility: { ...v.channelVisibility, ecomm: newEcommVisibility },
            }
          : v
      ),
    }))

    try {
      const result = await updateAdminProductVariant({
        slug: product.slug,
        barcode,
        isActive: newActiveState,
        channelVisibility: { ecomm: newEcommVisibility },
      })
      applyProductVariants(result?.product)
    } catch (err) {
      setFormData((p) => ({ ...p, variants: prevVariants }))
      toast.error(err?.message || 'Toggle failed')
    }
  }

  const handleAddAttribute = (attr) => {
    if (isEdit) {
      setFormData((p) => {
        const variants = [...(p.variants || [])]
        if (!variants[0]) return p
        const attrs = variants[0].attributes || []
        const nextAttrs = editingAttribute
          ? attrs.map((a) => (a.id === attr.id ? attr : a))
          : [...attrs, attr]
        variants[0] = { ...variants[0], attributes: nextAttrs }
        return { ...p, variants, attributes: nextAttrs }
      })
      setEditingAttribute(null)
      return
    }

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

  const removeAttribute = (id) => {
    if (isEdit) {
      setFormData((p) => {
        const variants = [...(p.variants || [])]
        if (!variants[0]) return p
        const nextAttrs = (variants[0].attributes || []).filter((a) => a.id !== id)
        variants[0] = { ...variants[0], attributes: nextAttrs }
        return { ...p, variants, attributes: nextAttrs }
      })
      return
    }
    setFormData((p) => ({ ...p, attributes: p.attributes.filter((a) => a.id !== id) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isEdit) {
      setSaving(true)
      try {
        const fd = buildUpdateProductFormData(formData)
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
      return
    }

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

  const title = isEdit ? 'Edit product' : 'Create New Product'
  const subtitle = isEdit
    ? (product?.name ? `Editing “${product.name}”` : undefined)
    : 'Top fields = main variant (variants[0]) · "Add Variant" = extra variants'
  const busy = saving || loadingProduct || variantSaving

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="modal-content modal-content--product-full"
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className="product-modal-shell">
            <div className="modal-header">
              <div className="modal-header__text">
                <Dialog.Title className="modal-title">{title}</Dialog.Title>
                {subtitle ? <p className="modal-subtitle">{subtitle}</p> : null}
              </div>
              <Dialog.Close asChild>
                <button type="button" className="btn btn--ghost btn--icon" aria-label="Close" disabled={busy}>
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            {error ? <div className="product-modal-error" role="alert">{error}</div> : null}
            {loadingProduct ? (
              <p className="modal-subtitle px-6 pt-2" role="status">Loading product details…</p>
            ) : null}

            <form className="product-modal-form" onSubmit={handleSubmit}>
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
                  productSlug={isEdit ? product.slug : undefined}
                  actionLoading={busy}
                />
              </div>
              <div className="product-modal-form__footer">
                <Button type="button" variant="secondary" fullWidth disabled={busy} onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" fullWidth disabled={busy} className="product-modal-submit">
                  {saving ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save changes' : 'Create Product')}
                </Button>
              </div>
            </form>
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
              currentMessage={formData.fomo?.customMessage}
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
              onClose={closeVariantModal}
              getDiscountPercentage={getDiscountPercentage}
              isSaving={variantSaving}
              saveError={variantSaveError}
            />
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
