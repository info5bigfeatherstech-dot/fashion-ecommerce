import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { stopLenis, startLenis } from '@/lib/lenis'
import { Button } from '@/components/ui/Button'
import ProductFormBody from '@/features/admin/components/product-form/ProductFormBody'
import VariantModal, { defaultVariant } from '@/features/admin/components/product-form/VariantModal'
import { BrandModal } from '@/features/admin/components/product-form/BrandModal'
import { CategoryQuickModal } from '@/features/admin/components/product-form/CategoryQuickModal'
import CustomMessageModal from '@/features/admin/components/product-form/CustomMessageModal'
import { marketingTagsFromProductTags } from '@/features/admin/constants/productMarketingTags'
import {
  emptyProductForm,
  formatIndianRupee,
  getBaseProductCode,
  getDiscountPercentage,
  getFormDataProductBase,
  nextVariantProductCode,
  normaliseVariantsForEdit,
  productToEditForm,
  validateCreateProductForm,
} from '@/features/admin/components/product-form/utils'
import {
  clearCreateProductDraft,
  readCreateProductDraft,
  rehydrateCreateDraft,
  writeCreateProductDraft,
} from '@/features/admin/components/product-form/createDraft'
import { shippingFormFromVariant } from '@/lib/variantCatalogForm'
import {
  addAdminProductVariant,
  buildCreateProductFormData,
  buildUpdateProductFormData,
  bulkUpdateAdminProductStatus,
  createAdminProduct,
  deleteAdminProductVariant,
  getAdminProductBySlug,
  syncAdminProductMarketingTags,
  updateAdminProduct,
  updateAdminProductVariant,
} from '@/features/admin/api/products'

function isWholesaleEligibleVariant(variant) {
  if (!variant) return false
  const on = Boolean(variant.wholesale)
  const base = parseFloat(variant?.price?.wholesaleBase ?? variant?.wholesaleBase) || 0
  return on && base > 0
}

/**
 * When product wholesale channel is active, never clear the last eligible wholesale
 * pricing on save (attributes/images/etc). Prefer form values when eligible;
 * otherwise keep server main-variant wholesale fields.
 */
function resolveMainVariantWholesalePayload(formMain, serverMain, productWholesaleActive) {
  const formEligible = isWholesaleEligibleVariant(formMain)
  const serverEligible = isWholesaleEligibleVariant(serverMain)

  if (formEligible) {
    const wholesaleBase = parseFloat(formMain.price?.wholesaleBase) || 0
    const wholesaleSaleRaw = formMain.price?.wholesaleSale
    const wholesaleSale =
      wholesaleSaleRaw !== '' && wholesaleSaleRaw != null
        ? parseFloat(wholesaleSaleRaw)
        : null
    return {
      wholesale: true,
      wholesaleBase,
      wholesaleSale: Number.isFinite(wholesaleSale) ? wholesaleSale : null,
      minimumOrderQuantity: parseInt(formMain.minimumOrderQuantity, 10) || 1,
      channelWholesale: 'active',
    }
  }

  if (productWholesaleActive && serverEligible) {
    const wholesaleBase = parseFloat(serverMain.price?.wholesaleBase ?? serverMain.wholesaleBase) || 0
    const wholesaleSaleRaw = serverMain.price?.wholesaleSale ?? serverMain.wholesaleSale
    const wholesaleSale =
      wholesaleSaleRaw !== '' && wholesaleSaleRaw != null
        ? parseFloat(wholesaleSaleRaw)
        : null
    return {
      wholesale: true,
      wholesaleBase,
      wholesaleSale: Number.isFinite(wholesaleSale) ? wholesaleSale : null,
      minimumOrderQuantity: parseInt(serverMain.minimumOrderQuantity ?? formMain?.minimumOrderQuantity, 10) || 1,
      channelWholesale: 'active',
      preservedFromServer: true,
    }
  }

  const wholesaleOn = Boolean(formMain?.wholesale)
  const wholesaleBase = wholesaleOn
    ? (parseFloat(formMain?.price?.wholesaleBase) || 0)
    : undefined
  const wholesaleSale = wholesaleOn
    ? (formMain?.price?.wholesaleSale !== '' && formMain?.price?.wholesaleSale != null
      ? parseFloat(formMain.price.wholesaleSale)
      : null)
    : undefined

  return {
    wholesale: wholesaleOn,
    wholesaleBase,
    wholesaleSale: wholesaleOn && Number.isFinite(wholesaleSale) ? wholesaleSale : (wholesaleOn ? null : undefined),
    minimumOrderQuantity: wholesaleOn
      ? (parseInt(formMain?.minimumOrderQuantity, 10) || 1)
      : 1,
    channelWholesale: wholesaleOn && wholesaleBase > 0 ? 'active' : 'draft',
  }
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
  const [variantSaving, setVariantSaving] = useState(false)
  const [variantSaveError, setVariantSaveError] = useState(null)
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [error, setError] = useState('')
  /** Full product from GET — used to preserve wholesale eligibility on partial saves. */
  const [loadedProduct, setLoadedProduct] = useState(null)
  const savedMarketingTagsRef = useRef(null)
  const createHydratedRef = useRef(false)
  const draftQuotaWarnedRef = useRef(false)
  const [hasCreateDraft, setHasCreateDraft] = useState(false)
  const modalBodyRef = useRef(null)

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        if (modalBodyRef.current) {
          modalBodyRef.current.scrollTop = 0
        }
      })
    }
  }, [open])

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
      createHydratedRef.current = false
      setLoadedProduct(null)
      savedMarketingTagsRef.current = null
      setLoadingProduct(false)
      clearCreateProductDraft()
      setHasCreateDraft(false)
      const initialForm = emptyProductForm()
      setFormData(initialForm)
      openEditVariant('primary', initialForm)
      createHydratedRef.current = true
      return
    }

    // Hydrate immediately from list row, then refresh from full product GET.
    createHydratedRef.current = false
    const initialForm = productToEditForm(product)
    setFormData(initialForm)
    savedMarketingTagsRef.current = { ...(initialForm.marketingTags || {}) }
    setLoadedProduct(product || null)

    try {
      const pKeys = []
        ; (product?.variants || []).forEach((v) => {
          ; (v?.attributes || []).forEach((a) => {
            const k = (a?.key || a?.name || '').trim()
            if (k) pKeys.push(k)
          })
        })
        ; (product?.attributes || []).forEach((a) => {
          const k = (a?.key || a?.name || '').trim()
          if (k) pKeys.push(k)
        })
      if (pKeys.length) {
        const stored = JSON.parse(localStorage.getItem('admin_last_variant_attribute_keys') || '[]')
        localStorage.setItem('admin_last_variant_attribute_keys', JSON.stringify([...new Set([...pKeys, ...stored])]))
      }
    } catch { }

    let cancelled = false
    const slug = product.slug

      ; (async () => {
        setLoadingProduct(true)
        try {
          const full = await getAdminProductBySlug(slug)
          if (!cancelled && full) {
            setLoadedProduct(full)
            const nextForm = productToEditForm(full)
            setFormData(nextForm)
            savedMarketingTagsRef.current = { ...(nextForm.marketingTags || {}) }
          }
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
      setLoadedProduct(null)
      createHydratedRef.current = false
      clearCreateProductDraft()
      setHasCreateDraft(false)
      if (!isEdit) {
        setFormData(emptyProductForm())
      }
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
      clearCreateProductDraft()
      setHasCreateDraft(false)
      if (!isEdit) {
        setFormData(emptyProductForm())
      }
    }
    onOpenChange(nextOpen)
  }

  const validateVariantBeforeAdd = () => {
    // 1. Check Variant 1
    const isV1Editing = showVariantModal && (editingVariantIndex === 'primary' || editingVariantIndex === -1 || (isEdit && editingVariantIndex === 0))
    const v1Code = String(
      (isV1Editing ? variantForm?.ProductCode : null) ||
      formData.ProductCode ||
      (isEdit ? formData.variants?.[0]?.ProductCode || formData.variants?.[0]?.productCode : '') ||
      ''
    ).trim()

    const rawV1BasePrice = (isV1Editing ? variantForm?.price?.base : null) ??
      (isEdit ? formData.variants?.[0]?.price?.base : formData.price?.base)
    const v1BasePrice = parseFloat(rawV1BasePrice)

    const v1Attrs = (
      isV1Editing ? variantForm?.attributes : null
    ) || (isEdit ? formData.variants?.[0]?.attributes : formData.attributes) || []
    const hasAttrValue = v1Attrs.some(
      (a) => String(a?.key || '').trim() && String(a?.value || '').trim()
    )

    const v1Wholesale = isV1Editing
      ? variantForm?.wholesale
      : (isEdit ? formData.variants?.[0]?.wholesale : formData.wholesale)

    const v1Missing = []
    if (!v1Code) {
      v1Missing.push('Product Code')
    } else {
      const m = v1Code.toUpperCase().match(SUFFIXED_PRODUCT_CODE_REGEX)
      const seq = m ? Number(m[2]) : NaN
      if (!m || !Number.isInteger(seq) || seq < 1) {
        v1Missing.push('Product Code (format: BASE-1)')
      }
    }

    if (!rawV1BasePrice || Number.isNaN(v1BasePrice) || v1BasePrice <= 0) {
      v1Missing.push('Base Price')
    }

    if (!hasAttrValue) {
      const attrNames = v1Attrs.map((a) => a?.key).filter(Boolean)
      const attrLabel = attrNames.length > 0 ? `Attributes (${attrNames.join(', ')})` : 'Attributes (e.g. Color)'
      v1Missing.push(attrLabel)
    }

    if (v1Wholesale) {
      const wholesaleBase = parseFloat(
        (isV1Editing ? variantForm?.price?.wholesaleBase : null) ??
        (isEdit ? formData.variants?.[0]?.price?.wholesaleBase : formData.wholesaleBase)
      )
      if (!wholesaleBase || Number.isNaN(wholesaleBase) || wholesaleBase <= 0) {
        v1Missing.push('Wholesale Base Price')
      }
    }

    if (v1Missing.length > 0) {
      return {
        valid: false,
        message: `Required field${v1Missing.length > 1 ? 's' : ''} missing in Variant 1: ${v1Missing.join(', ')}`,
        targetIndex: isEdit ? 0 : 'primary',
      }
    }

    // 2. Check if a subsequent variant is currently open and being edited
    if (showVariantModal && editingVariantIndex !== null && editingVariantIndex !== 'primary' && editingVariantIndex !== -1 && !(isEdit && editingVariantIndex === 0)) {
      const currentIdx = editingVariantIndex
      const currCode = String(variantForm?.ProductCode || '').trim()
      const variantNumber = isEdit ? currentIdx + 1 : currentIdx + 2
      const currMissing = []

      if (!currCode) {
        currMissing.push('Product Code')
      }
      const rawCurrPrice = variantForm?.price?.base
      const currBasePrice = parseFloat(rawCurrPrice)
      if (!rawCurrPrice || Number.isNaN(currBasePrice) || currBasePrice <= 0) {
        currMissing.push('Base Price')
      }
      const hasCurrAttr = (variantForm?.attributes || []).some(
        (a) => String(a?.key || '').trim() && String(a?.value || '').trim()
      )
      if (!hasCurrAttr) {
        currMissing.push('Attributes')
      }

      if (currMissing.length > 0) {
        return {
          valid: false,
          message: `Required field${currMissing.length > 1 ? 's' : ''} missing in Variant ${variantNumber}: ${currMissing.join(', ')}`,
          targetIndex: currentIdx,
        }
      }
    }

    return { valid: true }
  }

  const handleGenerateVariant = async () => {
    const check = validateVariantBeforeAdd()
    if (!check.valid) {
      toast.error(check.message)
      if (check.targetIndex === 'primary' || (isEdit && check.targetIndex === 0)) {
        if (!showVariantModal || (editingVariantIndex !== 'primary' && editingVariantIndex !== -1 && editingVariantIndex !== 0)) {
          openEditVariant(check.targetIndex)
        }
      } else if (check.targetIndex !== null && check.targetIndex !== undefined) {
        if (!showVariantModal || editingVariantIndex !== check.targetIndex) {
          openEditVariant(check.targetIndex)
        }
      }
      return
    }

    // Commit currently open variant so its values are persisted before adding the next
    let baseCode = String(formData.ProductCode || '').trim()
    if (showVariantModal && variantForm) {
      if (editingVariantIndex === 'primary' || editingVariantIndex === -1) {
        baseCode = String(variantForm.ProductCode || formData.ProductCode || '').trim()
        const validAttributes = (variantForm.attributes || [])
          .filter((a) => String(a.key || '').trim() && String(a.value || '').trim())
          .map((a) => {
            const attr = { key: a.key.trim(), value: a.value.trim() }
            if (isColorAttributeKey(attr.key)) {
              const hex = normalizeHexColor(a.hex)
              if (hex) attr.hex = hex
            }
            return attr
          })
        setFormData((p) => ({
          ...p,
          ProductCode: baseCode || p.ProductCode,
          hsnCode: variantForm.hsnCode !== undefined ? variantForm.hsnCode : p.hsnCode,
          taxRate: variantForm.taxRate !== undefined ? variantForm.taxRate : p.taxRate,
          isFragile: variantForm.isFragile !== undefined ? variantForm.isFragile : p.isFragile,
          shipping: variantForm.shipping || p.shipping,
          price: {
            ...p.price,
            base: variantForm.price?.base ?? p.price?.base,
            sale: variantForm.price?.sale ?? p.price?.sale,
          },
          inventory: {
            ...p.inventory,
            ...variantForm.inventory,
          },
          attributes: validAttributes.length > 0 ? validAttributes : p.attributes,
          images: variantForm.images?.length > 0 ? variantForm.images : p.images,
          wholesale: variantForm.wholesale,
          wholesaleBase: variantForm.price?.wholesaleBase ?? p.wholesaleBase,
          wholesaleSale: variantForm.price?.wholesaleSale ?? p.wholesaleSale,
          minimumOrderQuantity: variantForm.minimumOrderQuantity ?? p.minimumOrderQuantity,
          status: variantForm.isActive ? 'active' : 'inactive',
        }))
      } else if (editingVariantIndex !== null && !isEdit) {
        setFormData((p) => ({
          ...p,
          variants: (p.variants || []).map((v, i) => (i === editingVariantIndex ? variantForm : v)),
        }))
      }
    }

    if (!baseCode) {
      baseCode = String(formData.ProductCode || '').trim()
    }

    const nextCode = nextVariantProductCode({ ...formData, ProductCode: baseCode })
    if (!nextCode) {
      toast.error('Could not determine next Product Code. Please check Product Code format.')
      return
    }

    // Collect candidate attribute keys (Color, Plating, etc.)
    const candidateKeys = []
    const addKey = (rawKey) => {
      const trimmed = String(rawKey || '').trim()
      if (trimmed && !candidateKeys.some((k) => k.toLowerCase() === trimmed.toLowerCase())) {
        candidateKeys.push(trimmed)
      }
    }
    if (Array.isArray(formData.attributes)) {
      formData.attributes.forEach((a) => {
        const k = a?.key || a?.name
        if (k) addKey(k)
      })
    }
    if (showVariantModal && variantForm?.attributes) {
      variantForm.attributes.forEach((a) => {
        const k = a?.key || a?.name
        if (k) addKey(k)
      })
    }
    ;(formData.variants || []).forEach((v) => {
      if (Array.isArray(v.attributes)) {
        v.attributes.forEach((a) => {
          const k = a?.key || a?.name
          if (k) addKey(k)
        })
      }
    })

    const initialAttributes = candidateKeys.length > 0
      ? candidateKeys.map((key) => ({ key, value: '', hex: '' }))
      : [{ key: 'Color', value: '', hex: '' }, { key: 'Plating', value: '', hex: '' }]

    const defaultBasePrice =
      (showVariantModal && variantForm?.price?.base) ||
      formData.price?.base ||
      formData.variants?.[0]?.price?.base ||
      999
    const defaultSalePrice =
      (showVariantModal && variantForm?.price?.sale) ||
      formData.price?.sale ||
      formData.variants?.[0]?.price?.sale ||
      null

    const newVariant = {
      ...defaultVariant,
      ProductCode: nextCode,
      productCode: nextCode,
      hsnCode: (showVariantModal && variantForm?.hsnCode) || formData.hsnCode || (formData.variants && formData.variants[0]?.hsnCode) || '',
      taxRate: (showVariantModal && variantForm?.taxRate !== undefined && variantForm?.taxRate !== '')
        ? variantForm.taxRate
        : (formData.taxRate !== undefined && formData.taxRate !== '' ? formData.taxRate : (formData.variants?.[0]?.taxRate ?? '')),
      isFragile: (showVariantModal && variantForm?.isFragile !== undefined) ? variantForm.isFragile : (formData.isFragile ?? false),
      shipping: (showVariantModal && variantForm?.shipping)
        ? { ...variantForm.shipping }
        : (formData.shipping ? { ...formData.shipping } : emptyVariantShippingForm()),
      price: {
        base: defaultBasePrice,
        sale: defaultSalePrice,
        wholesaleBase: '',
        wholesaleSale: '',
      },
      inventory: {
        quantity: '',
        lowStockThreshold: 0,
        trackInventory: true,
      },
      attributes: initialAttributes,
      images: [],
      isActive: true,
      wholesale: false,
      minimumOrderQuantity: 1,
      channelVisibility: { ecomm: 'active', wholesale: 'draft' },
    }

    if (!isEdit) {
      const nextIdx = (formData.variants || []).length
      setFormData((p) => ({
        ...p,
        variants: [...(p.variants || []), newVariant],
      }))
      setEditingVariantIndex(nextIdx)
      setVariantForm(newVariant)
      setShowVariantModal(true)
      toast.success(`Added variant ${nextCode}`)
      return
    }

    setVariantSaving(true)
    try {
      const pricePayload = {
        base: parseFloat(defaultBasePrice) || 0,
        sale: defaultSalePrice ? parseFloat(defaultSalePrice) : null,
      }
      const result = await addAdminProductVariant(product.slug, {
        ...newVariant,
        price: pricePayload,
        channelVisibility: { ecomm: 'active', wholesale: 'draft' },
      })
      if (result?.product) {
        setLoadedProduct(result.product)
        applyProductVariants(result.product)
      }
      toast.success(`Added variant ${nextCode}`)
      onSaved?.()
    } catch (err) {
      toast.error(err?.message || 'Failed to add variant')
    } finally {
      setVariantSaving(false)
    }
  }

  const openAddVariant = () => {
    handleGenerateVariant()
  }

  // Keep open "Add Variant" or primary form's ProductCode automatically in sync
  useEffect(() => {
    if (!showVariantModal) return
    if (editingVariantIndex === 'primary' || editingVariantIndex === -1) {
      if (formData.ProductCode && formData.ProductCode !== variantForm.ProductCode) {
        setVariantForm((prev) => ({ ...prev, ProductCode: formData.ProductCode }))
      }
      return
    }
    if (editingVariantIndex !== null) return
    const nextCode = nextVariantProductCode(formData)
    if (!nextCode) return

    setVariantForm((prev) => {
      if (!prev.ProductCode || prev.ProductCode === nextCode) {
        return prev.ProductCode === nextCode ? prev : { ...prev, ProductCode: nextCode }
      }
      const prevBase = getBaseProductCode(prev.ProductCode)
      const currentBase = getFormDataProductBase(formData)
      if (!prev.ProductCode || prevBase !== currentBase) {
        return { ...prev, ProductCode: nextCode }
      }
      return prev
    })
  }, [formData.ProductCode, formData.variants, showVariantModal, editingVariantIndex])

  const discardCreateDraft = () => {
    clearCreateProductDraft()
    setHasCreateDraft(false)
    setFormData(emptyProductForm())
    toast.message('Draft discarded')
  }

  const openEditVariant = (index, customForm = null) => {
    const currentForm = customForm || formData
    const isPrimary = index === 'primary' || index === -1 || (isEdit && index === 0)
    let v
    if (isPrimary) {
      v = {
        ProductCode: currentForm.ProductCode || currentForm.productCode || '',
        attributes: currentForm.attributes || [],
        price: currentForm.price || { base: '', sale: '' },
        inventory: currentForm.inventory || { quantity: '', lowStockThreshold: 0, trackInventory: true },
        images: currentForm.images || [],
        isActive: currentForm.status !== 'inactive',
        wholesale: currentForm.wholesale || false,
        wholesaleBase: currentForm.wholesaleBase || '',
        wholesaleSale: currentForm.wholesaleSale || '',
        minimumOrderQuantity: currentForm.minimumOrderQuantity || 1,
        channelVisibility: { ecomm: currentForm.status !== 'inactive' ? 'active' : 'draft', wholesale: 'draft' },
        title: currentForm.title || '',
        description: currentForm.description || '',
        hsnCode: currentForm.hsnCode || currentForm.variants?.[0]?.hsnCode || '',
        taxRate: currentForm.taxRate ?? currentForm.variants?.[0]?.taxRate ?? currentForm.variants?.[0]?.gstRate ?? '',
        isFragile: Boolean(currentForm.isFragile ?? currentForm.variants?.[0]?.isFragile),
        shipping: currentForm.shipping || currentForm.variants?.[0]?.shipping || emptyVariantShippingForm(),
      }
    } else {
      v = currentForm.variants?.[index]
    }
    if (!v) return
    setVariantForm({
      ProductCode: String(v.ProductCode ?? v.productCode ?? ''),
      hsnCode: String(v.hsnCode ?? (isPrimary ? currentForm.hsnCode : '') ?? ''),
      taxRate: v.taxRate !== undefined && v.taxRate !== null && v.taxRate !== ''
        ? v.taxRate
        : (v.gstRate !== undefined && v.gstRate !== null && v.gstRate !== ''
          ? v.gstRate
          : (isPrimary && currentForm.taxRate !== undefined ? currentForm.taxRate : '')),
      isFragile: Boolean(v.isFragile ?? (isPrimary ? currentForm.isFragile : false)),
      attributes: v.attributes?.length > 0
        ? v.attributes.map((a) => ({
          key: a.key || '',
          value: a.value || '',
          hex: a.hex || '',
          id: a.id,
        }))
        : [{ key: '', value: '', hex: '' }],
      price: {
        base: v.price?.base ?? '',
        sale: v.price?.sale ?? '',
        wholesaleBase: v.price?.wholesaleBase ?? v.wholesaleBase ?? '',
        wholesaleSale: v.price?.wholesaleSale ?? v.wholesaleSale ?? '',
      },
      inventory: {
        quantity: v.inventory?.quantity ?? '',
        lowStockThreshold: v.inventory?.lowStockThreshold ?? 0,
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
      shipping: shippingFormFromVariant(v, currentForm.shipping, currentForm),
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

  const applyProductVariants = (productPayload, { preserveMainAttributes = false } = {}) => {
    if (!productPayload?.variants) return
    setFormData((prev) => {
      const normalised = normaliseVariantsForEdit(productPayload.variants)
      // When saving an extra variant (index > 0), the server response replaces
      // variants[0] with its persisted attributes — which may not yet include
      // locally-added product attributes that the user hasn't saved yet.
      // Preserve the current local attributes on variants[0] in that case.
      if (preserveMainAttributes && normalised.length > 0 && prev.variants?.[0]?.attributes?.length > 0) {
        normalised[0] = { ...normalised[0], attributes: prev.variants[0].attributes }
      }
      return {
        ...prev,
        variants: normalised,
        // Keep formData.attributes in sync with variants[0].attributes
        attributes: preserveMainAttributes
          ? (prev.variants?.[0]?.attributes || prev.attributes)
          : (normalised[0]?.attributes || prev.attributes),
      }
    })
  }

  const handleVariantSave = async (variantToSave) => {
    setVariantSaveError(null)

    // Remember attribute keys for subsequent variants/products
    const usedKeys = (variantToSave.attributes || [])
      .map((a) => (a?.key || a?.name || '').trim())
      .filter(Boolean)
    if (usedKeys.length > 0) {
      try {
        const stored = JSON.parse(localStorage.getItem('admin_last_variant_attribute_keys') || '[]')
        localStorage.setItem('admin_last_variant_attribute_keys', JSON.stringify([...new Set([...usedKeys, ...stored])]))
      } catch { }
    }

    // Create mode: product does not exist yet — keep variants in local form only.
    if (!isEdit) {
      if (editingVariantIndex === 'primary' || editingVariantIndex === -1) {
        setFormData((p) => ({
          ...p,
          ProductCode: variantToSave.ProductCode || p.ProductCode,
          hsnCode: variantToSave.hsnCode !== undefined ? variantToSave.hsnCode : p.hsnCode,
          taxRate: variantToSave.taxRate !== undefined ? variantToSave.taxRate : p.taxRate,
          isFragile: variantToSave.isFragile !== undefined ? variantToSave.isFragile : p.isFragile,
          shipping: variantToSave.shipping || p.shipping,
          price: {
            ...p.price,
            base: variantToSave.price.base,
            sale: variantToSave.price.sale,
          },
          inventory: {
            ...p.inventory,
            ...variantToSave.inventory,
          },
          attributes: variantToSave.attributes,
          images: variantToSave.images,
          wholesale: variantToSave.wholesale,
          wholesaleBase: variantToSave.wholesaleBase,
          wholesaleSale: variantToSave.wholesaleSale,
          minimumOrderQuantity: variantToSave.minimumOrderQuantity,
          status: variantToSave.isActive ? 'active' : 'inactive',
        }))
      } else if (editingVariantIndex !== null) {
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

    // If product wholesale channel is active, at least one variant must remain eligible
    // after this save. If none are eligible, deactivate wholesale channel first.
    const sourceProduct = loadedProduct || product
    let productWholesaleActive =
      String(sourceProduct?.channelStatus?.wholesale || '').toLowerCase() === 'active'
    if (productWholesaleActive) {
      const thisEligible = Boolean(variantToSave.wholesale && pricePayload.wholesaleBase > 0)
      const otherEligible = (formData.variants || []).some((v, i) => {
        if (editingVariantIndex !== null && i === editingVariantIndex) return false
        return isWholesaleEligibleVariant(v)
      })
      const serverMainEligible = isWholesaleEligibleVariant(sourceProduct?.variants?.[0])
      if (!thisEligible && !otherEligible && !serverMainEligible) {
        try {
          await bulkUpdateAdminProductStatus({
            slugs: [slug],
            channel: 'wholesale',
            status: 'draft',
          })
          productWholesaleActive = false
          setLoadedProduct((prev) =>
            prev
              ? {
                ...prev,
                channelStatus: {
                  ...(prev.channelStatus || {}),
                  wholesale: 'draft',
                },
              }
              : prev
          )
          toast.message('Wholesale was set Inactive — no wholesale price was configured.')
        } catch (err) {
          const message =
            err?.message ||
            'Wholesale storefront is active but no eligible wholesale variant is available. Add/update at least one variant with wholesale=true and wholesaleBase > 0.'
          setVariantSaveError(message)
          toast.error(message)
          return
        }
      }
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
        if (variantToSave.hsnCode !== undefined) variantUpdatePayload.hsnCode = variantToSave.hsnCode
        if (variantToSave.taxRate !== undefined && variantToSave.taxRate !== '') variantUpdatePayload.gstRate = String(variantToSave.taxRate)
        if (variantToSave.isFragile !== undefined) variantUpdatePayload.isFragile = variantToSave.isFragile
        if (variantToSave.shipping) variantUpdatePayload.shipping = variantToSave.shipping
        if (editingVariantIndex > 0) {
          variantUpdatePayload.variantTitle = variantToSave.title
          variantUpdatePayload.variantDescription = variantToSave.description
        } else if (editingVariantIndex === 0) {
          setFormData((p) => ({
            ...p,
            hsnCode: variantToSave.hsnCode !== undefined ? variantToSave.hsnCode : p.hsnCode,
            taxRate: variantToSave.taxRate !== undefined ? variantToSave.taxRate : p.taxRate,
            isFragile: variantToSave.isFragile !== undefined ? variantToSave.isFragile : p.isFragile,
            shipping: variantToSave.shipping || p.shipping,
          }))
        }
        const result = await updateAdminProductVariant(variantUpdatePayload)
        if (result?.product) {
          setLoadedProduct(result.product)
          // For extra variants (index > 0), preserve locally-edited product
          // attributes on variants[0] that haven't been submitted yet.
          applyProductVariants(result.product, { preserveMainAttributes: editingVariantIndex > 0 })
        }
        toast.success('Variant updated')
      } else {
        const result = await addAdminProductVariant(slug, {
          ...variantToSave,
          price: pricePayload,
          channelVisibility: channelVisibilityPayload,
        })
        if (result?.product) {
          setLoadedProduct(result.product)
          applyProductVariants(result.product)
        }
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
      toast.error('Cannot delete the main variant. It is the product itself.')
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
      toast.error('Cannot delete — variant has no productCode')
      return
    }

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
      if (!formData.name?.trim()) {
        setError('Product name is required')
        return
      }
      if (!formData.title?.trim()) {
        setError('Product title is required')
        return
      }
      if (!formData.category) {
        setError('Please select a category')
        return
      }

      setSaving(true)
      try {
        const mainVariant = formData.variants?.[0]
        const barcode = mainVariant?.productCode ?? mainVariant?.ProductCode

        // 1) Save main variant (price / wholesale / images) — same as fabFE updateVariantByBarcode
        if (barcode != null && barcode !== '') {
          const base = parseFloat(mainVariant.price?.base)
          if (!base || base <= 0) {
            throw new Error('Main variant base price is required and must be greater than 0')
          }
          const sale =
            mainVariant.price?.sale !== '' && mainVariant.price?.sale != null
              ? parseFloat(mainVariant.price.sale)
              : null
          if (sale !== null && Number.isFinite(sale) && sale >= base) {
            throw new Error('Main variant sale price must be less than base price')
          }

          const sourceProduct = loadedProduct || product
          let productWholesaleActive =
            String(sourceProduct?.channelStatus?.wholesale || '').toLowerCase() === 'active'
          const serverMain = sourceProduct?.variants?.[0] || null
          let wholesaleResolved = resolveMainVariantWholesalePayload(
            mainVariant,
            serverMain,
            productWholesaleActive
          )

          // Inconsistent state: wholesale channel ON but no variant has wholesaleBase > 0.
          // Deactivate wholesale channel so attribute/image saves can proceed (backend rejects otherwise).
          if (
            productWholesaleActive &&
            !(wholesaleResolved.wholesale && wholesaleResolved.wholesaleBase > 0)
          ) {
            await bulkUpdateAdminProductStatus({
              slugs: [product.slug],
              channel: 'wholesale',
              status: 'draft',
            })
            productWholesaleActive = false
            wholesaleResolved = resolveMainVariantWholesalePayload(mainVariant, serverMain, false)
            setLoadedProduct((prev) =>
              prev
                ? {
                  ...prev,
                  channelStatus: {
                    ...(prev.channelStatus || {}),
                    wholesale: 'draft',
                  },
                }
                : prev
            )
            toast.message('Wholesale set to Inactive — no wholesale price was configured on any variant.')
          }

          if (
            wholesaleResolved.wholesale &&
            wholesaleResolved.wholesaleSale != null &&
            Number.isFinite(wholesaleResolved.wholesaleSale) &&
            wholesaleResolved.wholesaleSale >= wholesaleResolved.wholesaleBase
          ) {
            throw new Error('Wholesale sale price must be less than wholesale base price')
          }

          const pricePayload = {
            base,
            sale: Number.isFinite(sale) ? sale : null,
            ...(wholesaleResolved.wholesale
              ? {
                wholesaleBase: wholesaleResolved.wholesaleBase,
                wholesaleSale: wholesaleResolved.wholesaleSale ?? null,
              }
              : {}),
          }
          const channelVisibilityPayload = {
            ecomm: mainVariant.channelVisibility?.ecomm || 'active',
            wholesale: wholesaleResolved.channelWholesale,
          }

          const variantResult = await updateAdminProductVariant({
            slug: product.slug,
            barcode,
            price: pricePayload,
            inventory: mainVariant.inventory,
            attributes: mainVariant.attributes,
            isActive: mainVariant.isActive,
            images: mainVariant.images,
            wholesale: wholesaleResolved.wholesale,
            minimumOrderQuantity: wholesaleResolved.minimumOrderQuantity,
            channelVisibility: channelVisibilityPayload,
          })
          if (variantResult?.product) {
            setLoadedProduct(variantResult.product)
            applyProductVariants(variantResult.product)
          }
        }

        // 2) Product-level fields only (no variants / images) — PUT /admin/products/:slug
        const fd = buildUpdateProductFormData({
          ...formData,
          // Prefer attributes from main variant in edit mode
          attributes: formData.variants?.[0]?.attributes || formData.attributes || [],
        })
        await updateAdminProduct(product.slug, fd)
        await syncAdminProductMarketingTags(
          product.slug,
          formData.marketingTags,
          savedMarketingTagsRef.current || marketingTagsFromProductTags(loadedProduct?.tags ?? product?.tags)
        )
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

    const payloadForm = { ...formData }
    if (!payloadForm.price?.base && payloadForm.variants?.[0]?.price?.base) {
      payloadForm.price = {
        base: payloadForm.variants[0].price.base,
        sale: payloadForm.variants[0].price.sale,
      }
    }
    if (!payloadForm.ProductCode && payloadForm.variants?.[0]?.ProductCode) {
      payloadForm.ProductCode = payloadForm.variants[0].ProductCode
    }
    if (!payloadForm.hsnCode && payloadForm.variants?.[0]?.hsnCode) {
      payloadForm.hsnCode = payloadForm.variants[0].hsnCode
    }
    if ((payloadForm.taxRate === '' || payloadForm.taxRate == null) && payloadForm.variants?.[0]?.taxRate !== undefined && payloadForm.variants?.[0]?.taxRate !== '') {
      payloadForm.taxRate = payloadForm.variants[0].taxRate
    }
    if (payloadForm.variants?.[0]?.isFragile !== undefined) {
      payloadForm.isFragile = payloadForm.variants[0].isFragile
    }
    if (!payloadForm.shipping?.weight && payloadForm.variants?.[0]?.shipping?.weight) {
      payloadForm.shipping = payloadForm.variants[0].shipping
    }
    if (payloadForm.variants?.[0]?.images?.length && (!payloadForm.images || payloadForm.images.length === 0)) {
      payloadForm.images = payloadForm.variants[0].images
    }

    try {
      validateCreateProductForm(payloadForm)
    } catch (err) {
      setError(err.message)
      return
    }
    setSaving(true)
    try {
      const fd = buildCreateProductFormData(payloadForm)
      const created = await createAdminProduct(fd)
      const slug = created?.product?.slug || created?.slug
      if (slug) {
        await syncAdminProductMarketingTags(slug, formData.marketingTags, {})
      }
      toast.success('Product created')
      clearCreateProductDraft()
      setHasCreateDraft(false)
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
                {!isEdit && hasCreateDraft ? (
                  <button
                    type="button"
                    className="btn btn--ghost"
                    style={{ marginTop: 8, fontSize: '0.8rem' }}
                    onClick={discardCreateDraft}
                    disabled={busy}
                  >
                    Discard draft
                  </button>
                ) : null}
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
              <div ref={modalBodyRef} className="product-modal-form__body product-modal-form__body--wide">
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
                  onGenerateVariant={handleGenerateVariant}
                  onOpenEditVariant={openEditVariant}
                  onRemoveAttribute={removeAttribute}
                  onDeleteVariant={deleteVariant}
                  onToggleVariantActive={toggleVariantActive}
                  formatIndianRupee={formatIndianRupee}
                  getDiscountPercentage={getDiscountPercentage}
                  productSlug={isEdit ? product.slug : undefined}
                  actionLoading={busy}
                  variantForm={variantForm}
                  setVariantForm={setVariantForm}
                  editingVariantIndex={editingVariantIndex}
                  showVariantForm={showVariantModal}
                  onSaveVariant={handleVariantSave}
                  onCloseVariantForm={closeVariantModal}
                  variantSaving={variantSaving}
                  variantSaveError={variantSaveError}
                  modalOpen={open}
                />
              </div>
              <div className="product-modal-form__footer">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  disabled={busy}
                  onClick={() => {
                    if (!isEdit) {
                      clearCreateProductDraft()
                      setHasCreateDraft(false)
                      setFormData(emptyProductForm())
                    }
                    onOpenChange(false)
                  }}
                >
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
              selectOnCreate
              onSelect={(catId) => setFormData((p) => ({ ...p, category: catId }))}
              onCreated={() => onCategoriesChange?.()}
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
          {showCustomMessageModal ? (
            <CustomMessageModal
              currentMessage={formData.fomo?.customMessage}
              onSave={(msg) => setFormData((p) => ({ ...p, fomo: { ...p.fomo, customMessage: msg } }))}
              onClose={() => setShowCustomMessageModal(false)}
            />
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
