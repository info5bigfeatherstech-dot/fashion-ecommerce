import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { Trash2, X } from 'lucide-react'
import { ADMIN_PRODUCT_MARKETING_TAGS } from '@/features/admin/constants/productMarketingTags'
import { useAdminProductCodePrefixSettings } from '@/features/admin/hooks'
import VariantModal from './VariantModal'
import { parseQuantityInput, quantityFieldValue, nextVariantProductCode, TAX_RATE_OPTIONS } from './utils'
import {
  isPlatingAttributeKey,
  PLATING_OPTIONS,
  COLOR_KEY_RE,
  resolveSwatchBackground,
  suggestHexForColorName,
  normalizeHexColor,
  MULTI_COLOR_GRADIENT,
} from '@/features/product/colorSwatch'

const POPULAR_COLOR_PALETTE = [
  { name: 'Black', hex: '#14120F' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gold', hex: '#C9A227' },
  { name: 'Rose Gold', hex: '#B76E79' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Oxidized Silver', hex: '#4A4A4A' },
  { name: 'Maroon', hex: '#6D1A2A' },
  { name: 'Red', hex: '#C62828' },
  { name: 'Ruby Red', hex: '#9B2335' },
  { name: 'Blue', hex: '#1E4E8C' },
  { name: 'Navy', hex: '#1B2A4A' },
  { name: 'Sapphire Blue', hex: '#0F52BA' },
  { name: 'Green', hex: '#2E7D4F' },
  { name: 'Emerald Green', hex: '#137547' },
  { name: 'Mint Green', hex: '#8FE3C0' },
  { name: 'Pink', hex: '#E8A0B0' },
  { name: 'Baby Pink', hex: '#F7C6D0' },
  { name: 'Purple', hex: '#6B3FA0' },
  { name: 'Lavender', hex: '#B57EDC' },
  { name: 'Yellow', hex: '#E6B800' },
  { name: 'Orange', hex: '#E07A3A' },
  { name: 'Peach', hex: '#FFCBA4' },
  { name: 'Brown', hex: '#5C4033' },
  { name: 'Beige', hex: '#D4C4A8' },
  { name: 'Multi-Color', hex: MULTI_COLOR_GRADIENT },
]

const MARKETING_TOGGLE_CLASS = {
  'on-sale': 'pf-toggle--onsale',
  'today-arrival': 'pf-toggle--today',
  'jewellery-spotted': 'pf-toggle--spotted',
  'bestselling-jewelry': 'pf-toggle--bestselling',
  'festive-offer': 'pf-toggle--festive',
}

export default function ProductFormBody({
  formData,
  setFormData,
  categories,
  brands,
  onOpenCategoryModal,
  onOpenBrandModal,
  onOpenAttributeModal: _onOpenAttributeModal,
  onEditAttribute: _onEditAttribute,
  onOpenCustomMessage,
  onOpenAddVariant,
  onGenerateVariant,
  onOpenEditVariant,
  onDeleteVariant,
  onToggleVariantActive,
  onRemoveAttribute,
  formatIndianRupee,
  getDiscountPercentage,
  productSlug,
  actionLoading = false,
  actionError = null,
  variantForm,
  setVariantForm,
  editingVariantIndex,
  showVariantForm = false,
  onSaveVariant,
  onCloseVariantForm,
  variantSaving = false,
  variantSaveError = null,
  modalOpen = true,
}) {
  const isEditMode = !!productSlug;
  const { data: prefixSettings } = useAdminProductCodePrefixSettings({ enabled: !isEditMode })
  const listingPrefix = prefixSettings?.configured ? String(prefixSettings.prefix || '').toUpperCase() : ''
  const variantDropdownRef = useRef(null);

  // Specifications (Attributes) state
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [newSpecHex, setNewSpecHex] = useState('');
  const [activeColorPaletteId, setActiveColorPaletteId] = useState(null);
  const [popoverPlacement, setPopoverPlacement] = useState('bottom');
  const colorPaletteRef = useRef(null);

  const handleToggleColorPalette = (id, event) => {
    if (activeColorPaletteId === id) {
      setActiveColorPaletteId(null);
      return;
    }
    const rect = event?.currentTarget?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      setPopoverPlacement(spaceBelow < 310 ? 'top' : 'bottom');
    }
    setActiveColorPaletteId(id);
  };

  useEffect(() => {
    if (!activeColorPaletteId) return;
    const handleClickOutside = (e) => {
      if (colorPaletteRef.current && !colorPaletteRef.current.contains(e.target)) {
        setActiveColorPaletteId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeColorPaletteId]);

  const updateAttribute = (attrId, updates) => {
    if (isEditMode) {
      setFormData((p) => {
        const variants = [...(p.variants || [])];
        if (!variants[0]) return p;
        const nextAttrs = (variants[0].attributes || []).map((a) =>
          a.id === attrId ? { ...a, ...updates } : a
        );
        variants[0] = { ...variants[0], attributes: nextAttrs };
        return { ...p, variants, attributes: nextAttrs };
      });
    } else {
      setFormData((p) => ({
        ...p,
        attributes: (p.attributes || []).map((a) =>
          a.id === attrId ? { ...a, ...updates } : a
        ),
      }));
    }
    if (showVariantForm && (editingVariantIndex === 'primary' || editingVariantIndex === -1 || (isEditMode && editingVariantIndex === 0)) && setVariantForm) {
      setVariantForm((prev) => {
        if (!prev || !Array.isArray(prev.attributes)) return prev;
        const nextAttrs = prev.attributes.map((a) => (a.id === attrId ? { ...a, ...updates } : a));
        return { ...prev, attributes: nextAttrs };
      });
    }
  };

  const updateAttributeField = (attrId, field, val) => updateAttribute(attrId, { [field]: val });

  const handleAddNewSpec = () => {
    const k = newSpecName.trim();
    const v = newSpecValue.trim();
    if (!k || !v) return;

    const isNewColor = COLOR_KEY_RE.test(k);
    const suggested = isNewColor ? (newSpecHex || suggestHexForColorName(v)) : undefined;

    const newAttr = {
      id: `attr-${Date.now()}`,
      key: k,
      value: v,
      ...(suggested ? { hex: suggested } : {}),
    };

    if (isEditMode) {
      setFormData((p) => {
        const variants = [...(p.variants || [])];
        if (!variants[0]) return p;
        const nextAttrs = [...(variants[0].attributes || []), newAttr];
        variants[0] = { ...variants[0], attributes: nextAttrs };
        return { ...p, variants, attributes: nextAttrs };
      });
    } else {
      setFormData((p) => ({
        ...p,
        attributes: [...(p.attributes || []), newAttr],
      }));
    }

    if (setVariantForm) {
      setVariantForm((prev) => {
        if (!prev || !Array.isArray(prev.attributes)) return prev;
        const exists = prev.attributes.some(
          (a) => (a.key || '').trim().toLowerCase() === k.toLowerCase()
        );
        if (exists) return prev;
        return {
          ...prev,
          attributes: [...prev.attributes, { key: k, value: '', hex: '' }],
        };
      });
    }

    setNewSpecName('');
    setNewSpecValue('');
  };

  // Ensure default Color and Plating specification rows exist in create mode
  useEffect(() => {
    if (!isEditMode && (!formData.attributes || formData.attributes.length === 0)) {
      setFormData((p) => {
        if (p.attributes && p.attributes.length > 0) return p;
        return {
          ...p,
          attributes: [
            { id: 'attr-default-color', key: 'Color', value: '' },
            { id: 'attr-default-plating', key: 'Plating', value: '' },
          ],
        };
      });
    }
  }, [isEditMode]);

  const isInitialOpenRef = useRef(true);
  useEffect(() => {
    if (modalOpen) {
      isInitialOpenRef.current = true;
    }
  }, [modalOpen]);

  useEffect(() => {
    if (isInitialOpenRef.current) {
      isInitialOpenRef.current = false;
      return;
    }
    if (showVariantForm && variantDropdownRef.current) {
      variantDropdownRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showVariantForm, editingVariantIndex]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("shipping.dimensions.")) {
      const dim = name.split(".")[2];
      setFormData((p) => ({ ...p, shipping: { ...p.shipping, dimensions: { ...p.shipping.dimensions, [dim]: value } } }));
    } else if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((p) => ({ ...p, [parent]: { ...p[parent], [child]: type === "checkbox" ? checked : value } }));
    } else {
      const val = type === "checkbox" ? checked : value;
      setFormData((p) => {
        const next = { ...p, [name]: val };
        if (name === 'title') {
          next.variants = (p.variants || []).map((v) =>
            (!v.title || v.title === p.title || v.title === p.name ? { ...v, title: val } : v)
          );
        } else if (name === 'name' && !p.title) {
          next.variants = (p.variants || []).map((v) =>
            (!v.title || v.title === p.name ? { ...v, title: val } : v)
          );
        } else if (name === 'description') {
          next.variants = (p.variants || []).map((v) =>
            (!v.description || v.description === p.description ? { ...v, description: val } : v)
          );
        }
        return next;
      });

      if (showVariantForm && setVariantForm && (editingVariantIndex === 'primary' || editingVariantIndex === -1 || (isEditMode && editingVariantIndex === 0))) {
        if (name === 'title') {
          setVariantForm((prev) => (!prev?.title || prev.title === formData.title || prev.title === formData.name ? { ...prev, title: val } : prev));
        } else if (name === 'name' && !formData.title) {
          setVariantForm((prev) => (!prev?.title || prev.title === formData.name ? { ...prev, title: val } : prev));
        }
        if (name === 'description') {
          setVariantForm((prev) => (!prev?.description || prev.description === formData.description ? { ...prev, description: val } : prev));
        }
      }
    }
  };

  const primaryVariant = isEditMode ? (formData.variants?.[0] ?? null) : null;
  const displayedAttributes = isEditMode ? (primaryVariant?.attributes || []) : (formData.attributes || []);

  const primaryBase = formData.price?.base ?? "";
  const primarySale = formData.price?.sale ?? "";
  const primaryQty = formData.inventory?.quantity;

  const formatAttributesSummary = (attrs) => {
    if (!attrs || !attrs.length) return ''
    const parts = attrs
      .filter((a) => a && (String(a.key || '').trim() || String(a.value || '').trim()))
      .map((a) => {
        const k = String(a.key || '').trim()
        const v = String(a.value || '').trim()
        if (k && v) return `${k}: ${v}`
        return v || k
      })
    return parts.join(' · ')
  }

  const allVariantsList = (() => {
    const list = []
    if (isEditMode) {
      if (formData.variants && formData.variants.length > 0) {
        formData.variants.forEach((v, i) => {
          const isPrimary = i === 0
          const isThisEditing = showVariantForm && editingVariantIndex === i
          list.push({
            isPrimary,
            realIndex: i,
            displayIndex: i + 1,
            code: isThisEditing
              ? (variantForm?.ProductCode || v.ProductCode || v.productCode || (isPrimary ? (formData.ProductCode || formData.productCode) : ''))
              : (v.ProductCode || v.productCode || (isPrimary ? (formData.ProductCode || formData.productCode) : '')),
            attributes: isThisEditing
              ? (variantForm?.attributes || (isPrimary ? displayedAttributes : (v.attributes || [])))
              : (isPrimary ? (displayedAttributes.length > 0 ? displayedAttributes : (v.attributes || [])) : (v.attributes || [])),
            price: isThisEditing
              ? (variantForm?.price?.sale || variantForm?.price?.base || (isPrimary ? (v.price?.sale || v.price?.base || primarySale || primaryBase) : (v.price?.sale || v.price?.base || '')))
              : (isPrimary ? (v.price?.sale || v.price?.base || primarySale || primaryBase) : (v.price?.sale || v.price?.base || '')),
            stock: isThisEditing
              ? (variantForm?.inventory?.quantity ?? v.inventory?.quantity ?? (isPrimary ? (primaryQty ?? 0) : 0))
              : (v.inventory?.quantity ?? (isPrimary ? (primaryQty ?? 0) : 0)),
            isActive: v.channelVisibility?.ecomm === 'active' || (v.isActive !== false && v.channelVisibility?.ecomm !== 'draft'),
            raw: v,
          })
        })
      }
    } else {
      const isV1ActiveEditing = showVariantForm && (editingVariantIndex === 'primary' || editingVariantIndex === -1)
      list.push({
        isPrimary: true,
        realIndex: 'primary',
        displayIndex: 1,
        code: isV1ActiveEditing
          ? (variantForm?.ProductCode || formData.ProductCode || formData.productCode || '')
          : (formData.ProductCode || formData.productCode || ''),
        attributes: isV1ActiveEditing
          ? (variantForm?.attributes || formData.attributes || [])
          : (formData.attributes || []),
        price: isV1ActiveEditing
          ? (variantForm?.price?.sale || variantForm?.price?.base || formData.price?.sale || formData.price?.base || '')
          : (formData.price?.sale || formData.price?.base || ''),
        stock: isV1ActiveEditing
          ? (variantForm?.inventory?.quantity ?? formData.inventory?.quantity ?? 0)
          : (formData.inventory?.quantity ?? 0),
        isActive: formData.status !== 'inactive',
      })
        ; (formData.variants || []).forEach((v, i) => {
          const isThisEditing = showVariantForm && editingVariantIndex === i
          list.push({
            isPrimary: false,
            realIndex: i,
            displayIndex: i + 2,
            code: isThisEditing ? (variantForm?.ProductCode || v.ProductCode || v.productCode || '') : (v.ProductCode || v.productCode || ''),
            attributes: isThisEditing ? (variantForm?.attributes || v.attributes || []) : (v.attributes || []),
            price: isThisEditing ? (variantForm?.price?.sale || variantForm?.price?.base || v.price?.sale || v.price?.base || '') : (v.price?.sale || v.price?.base || ''),
            stock: isThisEditing ? (variantForm?.inventory?.quantity ?? v.inventory?.quantity ?? 0) : (v.inventory?.quantity ?? 0),
            isActive: v.channelVisibility?.ecomm === 'active' || (v.isActive !== false && v.channelVisibility?.ecomm !== 'draft'),
            raw: v,
          })
        })
    }
    return list
  })()

  const handleVariantToggleActive = (variant) => {
    if (variant.realIndex === 'primary' || variant.realIndex === -1) {
      setFormData((p) => ({
        ...p,
        status: p.status === 'inactive' ? 'active' : 'inactive',
      }))
      return
    }
    onToggleVariantActive?.(variant.realIndex)
  }

  const handleVariantChevronClick = (variant) => {
    if (showVariantForm && editingVariantIndex === variant.realIndex) {
      onCloseVariantForm?.()
    } else {
      onOpenEditVariant?.(variant.realIndex)
    }
  }

  const [variantToDelete, setVariantToDelete] = useState(null)
  const [isDeletingVariant, setIsDeletingVariant] = useState(false)

  const handleConfirmDeleteVariant = async () => {
    if (!variantToDelete) return
    try {
      setIsDeletingVariant(true)
      await onDeleteVariant?.(variantToDelete.realIndex)
      setVariantToDelete(null)
    } finally {
      setIsDeletingVariant(false)
    }
  }

  return (
    <div className="pf-layout">

      <div className="pf-layout__main">
        <div className="pf-card">
          <div className="pf-card__head">
            <h3>Essential Details</h3>
          </div>
          <div className="pf-card__body">
            <div className="pf-field">
              <label>Product Name <span className="pf-req">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className="pf-input" placeholder="e.g., Premium Wireless Headphones" required />
            </div>
            <div className="pf-field">
              <label>Title <span className="pf-req">*</span></label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="pf-input" placeholder="e.g., Noise Cancelling Headphones" required />
            </div>
            <div className="pf-field">
              <label>Description <span className="pf-req">*</span></label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="pf-input pf-textarea" placeholder="Describe your product..." />
            </div>
            <div className="pf-row">
              <div className="pf-field">
                <label>Category</label>
                <div className="pf-select-plus">
                  <select name="category" value={formData.category} onChange={handleInputChange} className="pf-input">
                    <option value="">Select category</option>
                    {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                  </select>
                  <button type="button" onClick={onOpenCategoryModal} className="pf-plus" aria-label="Manage categories" title="Manage categories">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
              </div>
              <div className="pf-field">
                <label>Brand</label>
                <div className="pf-select-plus">
                  <select name="brand" value={formData.brand} onChange={handleInputChange} className="pf-input">
                    {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <button type="button" onClick={onOpenBrandModal} className="pf-plus" aria-label="Add brand">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="pf-field">
              <div className="flex items-center justify-between mb-1.5" style={{ minHeight: '28px' }}>
                <label className="block text-sm font-medium text-gray-700">
                  Product Code <span className="pf-req">*</span>
                </label>
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      const newCode = `${rand}-1`;
                      setFormData((p) => ({ ...p, ProductCode: newCode }));
                      if (showVariantForm && setVariantForm) {
                        if (editingVariantIndex === 'primary' || editingVariantIndex === -1) {
                          setVariantForm((prev) => ({ ...prev, ProductCode: newCode }));
                        } else if (editingVariantIndex === null) {
                          const nextCode = nextVariantProductCode({ ...formData, ProductCode: newCode });
                          if (nextCode) {
                            setVariantForm((prev) => ({ ...prev, ProductCode: nextCode }));
                          }
                        }
                      }
                    }}
                    className="pf-autogen-btn"
                    title="Generate a unique product code"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    <span>Auto-generate</span>
                  </button>
                )}
              </div>
              <div className={`pf-code-group${isEditMode ? ' is-disabled' : ''}`}>
                {listingPrefix ? (
                  <span
                    className="pf-code-prefix"
                    title="Configured listing prefix"
                  >
                    {listingPrefix}
                  </span>
                ) : null}
                <input
                  type="text"
                  value={formData.ProductCode || ""}
                  disabled={isEditMode}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((p) => ({ ...p, ProductCode: val }));
                    if (showVariantForm && setVariantForm) {
                      if (editingVariantIndex === 'primary' || editingVariantIndex === -1) {
                        setVariantForm((prev) => ({ ...prev, ProductCode: val }));
                      } else if (editingVariantIndex === null) {
                        const nextCode = nextVariantProductCode({ ...formData, ProductCode: val });
                        if (nextCode) {
                          setVariantForm((prev) => ({ ...prev, ProductCode: nextCode }));
                        }
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim().toUpperCase();
                    if (val) {
                      const formatted = /-\d+$/.test(val) ? val : `${val}-1`;
                      setFormData((p) => ({ ...p, ProductCode: formatted }));
                      if (showVariantForm && setVariantForm) {
                        if (editingVariantIndex === 'primary' || editingVariantIndex === -1) {
                          setVariantForm((prev) => ({ ...prev, ProductCode: formatted }));
                        } else if (editingVariantIndex === null) {
                          const nextCode = nextVariantProductCode({ ...formData, ProductCode: formatted });
                          if (nextCode) {
                            setVariantForm((prev) => ({ ...prev, ProductCode: nextCode }));
                          }
                        }
                      }
                    }
                  }}
                  className="pf-code-input"
                  placeholder="e.g. 788-1"
                  maxLength={20}
                />
              </div>
              {listingPrefix ? (
                <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
                  <span>Saved as</span>
                  <span className="pf-code-tag">
                    {listingPrefix}
                    {String(formData.ProductCode || '').trim()
                      ? (/-\d+$/.test(String(formData.ProductCode).trim())
                          ? String(formData.ProductCode).trim()
                          : `${String(formData.ProductCode).trim()}-1`)
                      : '…'}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-xs text-amber-700">
                  Set a product code prefix in{' '}
                  <Link to="/admin/settings/product-code-prefix" className="underline font-medium">
                    Settings → Product code prefix
                  </Link>{' '}
                  before listing. Main variant automatically takes <span className="font-mono font-semibold">-1</span>.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="pf-card">
          <div className="pf-card__head">
            <h3>Marketing & Visibility</h3>
          </div>
          <div className="pf-card__body">
            {/* Read-only Ecom Status Badge */}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Featured Product</span>
              <button
                type="button"
                aria-pressed={Boolean(formData.isFeatured)}
                onClick={() => setFormData((p) => ({ ...p, isFeatured: !p.isFeatured }))}
                className={`pf-toggle pf-toggle--featured${formData.isFeatured ? ' is-on' : ''}`}
              >
                <span className="pf-toggle__knob" />
              </button>
            </div>

            <div className="admin-product-tags-form">
              <p className="admin-product-tags-form__hint">
                Marketing tags for storefront sections (Sale is live, Today’s Deal, etc.)
              </p>
              {ADMIN_PRODUCT_MARKETING_TAGS.map((tag) => {
                const isOn = Boolean(formData.marketingTags?.[tag.id])
                const toggleClass = MARKETING_TOGGLE_CLASS[tag.id] || 'pf-toggle--today'
                return (
                  <div key={tag.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-700">{tag.label}</span>
                      <span className="admin-product-tags-form__desc">{tag.description}</span>
                    </div>
                    <button
                      type="button"
                      aria-pressed={isOn}
                      title={tag.description}
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          marketingTags: {
                            ...(p.marketingTags || {}),
                            [tag.id]: !isOn,
                          },
                        }))
                      }
                      className={`pf-toggle ${toggleClass}${isOn ? ' is-on' : ''}`}
                    >
                      <span className="pf-toggle__knob" />
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Sold Info</span>
                <button
                  type="button"
                  aria-pressed={Boolean(formData.soldInfo?.enabled)}
                  onClick={() => setFormData((p) => ({ ...p, soldInfo: { ...p.soldInfo, enabled: !p.soldInfo.enabled } }))}
                  className={`pf-toggle pf-toggle--sold${formData.soldInfo?.enabled ? ' is-on' : ''}`}
                >
                  <span className="pf-toggle__knob" />
                </button>
              </div>
              {formData.soldInfo?.enabled && (
                <input type="number" value={formData.soldInfo?.count ?? 0} onChange={(e) => setFormData((p) => ({ ...p, soldInfo: { ...p.soldInfo, count: parseInt(e.target.value) || 0 } }))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg" placeholder="Number sold" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">FOMO</span>
                <button
                  type="button"
                  aria-pressed={Boolean(formData.fomo?.enabled)}
                  onClick={() => setFormData((p) => ({ ...p, fomo: { ...p.fomo, enabled: !p.fomo.enabled } }))}
                  className={`pf-toggle pf-toggle--fomo${formData.fomo?.enabled ? ' is-on' : ''}`}
                >
                  <span className="pf-toggle__knob" />
                </button>
              </div>
              {formData.fomo?.enabled && (
                <div className="space-y-2">
                  <select value={formData.fomo.type} onChange={(e) => setFormData((p) => ({ ...p, fomo: { ...p.fomo, type: e.target.value } }))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <option value="viewing_now">Viewing Now</option>
                    <option value="product_left">Product Left</option>
                    <option value="custom">Custom</option>
                  </select>
                  {formData.fomo.type === "viewing_now" && (
                    <input type="number" value={formData.fomo.viewingNow ?? 0} onChange={(e) => setFormData((p) => ({ ...p, fomo: { ...p.fomo, viewingNow: parseInt(e.target.value) || 0 } }))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg" placeholder="Viewing now count" />
                  )}
                  {formData.fomo.type === "product_left" && (
                    <input type="number" value={formData.fomo.productLeft ?? 0} onChange={(e) => setFormData((p) => ({ ...p, fomo: { ...p.fomo, productLeft: parseInt(e.target.value) || 0 } }))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg" placeholder="Items left" />
                  )}
                  {formData.fomo.type === "custom" && (
                    <div className="flex gap-2">
                      <input type="text" value={formData.fomo.customMessage ?? ""} readOnly className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg" placeholder="Custom message" />
                      <button type="button" onClick={() => onOpenCustomMessage(formData.fomo.customMessage || "")} className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tax & Handling Details */}
        <div className="pf-card">
          <div className="pf-card__head">
            <h3>Tax &amp; Handling Details</h3>
            <p>HSN code, GST rate, and shipping handling requirements (Weight &amp; Dimensions are configured per variant)</p>
          </div>
          <div className="pf-card__body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">HSN Code</label>
                <input
                  type="text"
                  value={formData.hsnCode || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, hsnCode: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="e.g., 7117"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">Harmonized System Nomenclature code for tax purposes</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">GST Rate</label>
                <select
                  value={formData.taxRate ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, taxRate: e.target.value === "" ? "" : parseFloat(e.target.value) }))}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm"
                >
                  <option value="">Select GST Rate</option>
                  {TAX_RATE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Applicable GST percentage for this product</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fragile Item?</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="radio"
                    name="isFragile"
                    value="true"
                    checked={formData.isFragile === true}
                    onChange={() => setFormData((p) => ({ ...p, isFragile: true }))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Yes (Fragile)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="radio"
                    name="isFragile"
                    value="false"
                    checked={formData.isFragile !== true}
                    onChange={() => setFormData((p) => ({ ...p, isFragile: false }))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>No</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">Indicates if special handling is required during shipping</p>
            </div>
          </div>
        </div>

        {/* Product Attributes / Specifications */}
        <div className="pf-card">
          <div className="pf-card__head">
            <div>
              <h3>Product Attributes</h3>
              <p className="text-xs text-gray-500 mt-0.5">Specifications like Color, Plating, Material, etc.</p>
            </div>
          </div>
          <div className="pf-card__body space-y-2.5">
            {displayedAttributes.length > 0 && (
              <div className="space-y-1.5">
                {displayedAttributes.map((attr, idx) => {
                  const isPlating = isPlatingAttributeKey(attr.key);
                  const isColor = COLOR_KEY_RE.test(String(attr.key || '').trim());
                  return (
                    <div
                      key={attr.id || idx}
                      className="pf-spec-row"
                    >
                      <input
                        type="text"
                        value={attr.key || ''}
                        onChange={(e) => updateAttributeField(attr.id, 'key', e.target.value)}
                        className="pf-spec-input flex-1 min-w-0 font-medium text-gray-900"
                        placeholder="Name (e.g. Color)"
                      />
                      {isPlating ? (
                        <select
                          value={attr.value || ''}
                          onChange={(e) => updateAttributeField(attr.id, 'value', e.target.value)}
                          className="pf-spec-input flex-1 min-w-0 text-gray-900 cursor-pointer"
                        >
                          <option value="">Select Plating...</option>
                          {PLATING_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : isColor ? (
                        <div className={`pf-spec-color-wrap${activeColorPaletteId === attr.id ? ' is-open' : ''}`}>
                          <button
                            type="button"
                            onClick={(e) => handleToggleColorPalette(attr.id, e)}
                            className="pf-spec-swatch-btn"
                            title="Click to open color palette"
                            aria-label={`Color palette for ${attr.value || 'color'}`}
                          >
                            <span
                              className="pf-spec-swatch-circle"
                              style={{ background: resolveSwatchBackground(attr.value, attr.hex) }}
                            />
                            <svg className="w-2.5 h-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <input
                            type="text"
                            value={attr.value || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const suggested = suggestHexForColorName(val);
                              updateAttribute(attr.id, {
                                value: val,
                                ...(suggested ? { hex: suggested } : {}),
                              });
                            }}
                            className="pf-spec-input flex-1 min-w-0 text-gray-800"
                            placeholder="Color (e.g. Black, Maroon, Gold)"
                          />

                          {/* Color Palette Popover */}
                          {activeColorPaletteId === attr.id && (
                            <div
                              className={`pf-color-popover${popoverPlacement === 'top' ? ' pf-color-popover--top' : ''}`}
                              ref={colorPaletteRef}
                            >
                              <div className="pf-color-popover-header">
                                <span className="pf-color-popover-title">Color Palette</span>
                                <button
                                  type="button"
                                  onClick={() => setActiveColorPaletteId(null)}
                                  className="pf-color-popover-close"
                                  aria-label="Close palette"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="pf-color-grid">
                                {POPULAR_COLOR_PALETTE.map((color) => {
                                  const isSelected = String(attr.value || '').trim().toLowerCase() === color.name.toLowerCase();
                                  return (
                                    <button
                                      key={color.name}
                                      type="button"
                                      onClick={() => {
                                        updateAttribute(attr.id, {
                                          value: color.name,
                                          hex: color.hex.startsWith('#') ? color.hex : undefined,
                                        });
                                        setActiveColorPaletteId(null);
                                      }}
                                      className={`pf-color-swatch-item${isSelected ? ' is-selected' : ''}`}
                                      style={{ background: color.hex }}
                                      title={color.name}
                                      aria-label={color.name}
                                    />
                                  );
                                })}
                              </div>
                              <div className="pf-color-custom-section">
                                <label className="pf-color-native-picker" title="Pick custom color">
                                  <input
                                    type="color"
                                    value={normalizeHexColor(attr.hex) || suggestHexForColorName(attr.value) || '#14120F'}
                                    onChange={(e) => {
                                      const hexVal = e.target.value;
                                      updateAttribute(attr.id, { hex: hexVal });
                                    }}
                                  />
                                </label>
                                <input
                                  type="text"
                                  value={attr.hex || ''}
                                  onChange={(e) => updateAttribute(attr.id, { hex: e.target.value })}
                                  placeholder="#HEX"
                                  className="pf-spec-input pf-color-hex-input"
                                  maxLength={7}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={attr.value || ''}
                          onChange={(e) => updateAttributeField(attr.id, 'value', e.target.value)}
                          className="pf-spec-input flex-1 min-w-0 text-gray-800"
                          placeholder="Value"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => onRemoveAttribute(attr.id)}
                        title="Delete specification"
                        className="pf-spec-delete-btn"
                        aria-label="Delete specification"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Add Specification
              </div>
              <div className="pf-spec-add-row">
                <input
                  type="text"
                  value={newSpecName}
                  onChange={(e) => setNewSpecName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewSpec();
                    }
                  }}
                  placeholder="Name (e.g. Plating / Occasion)"
                  className="pf-spec-input flex-1 min-w-0"
                />
                {isPlatingAttributeKey(newSpecName) ? (
                  <select
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                    className="pf-spec-input flex-1 min-w-0 cursor-pointer"
                  >
                    <option value="">Select Plating...</option>
                    {PLATING_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : COLOR_KEY_RE.test(String(newSpecName || '').trim()) ? (
                  <div className={`pf-spec-color-wrap${activeColorPaletteId === 'new-spec' ? ' is-open' : ''}`}>
                    <button
                      type="button"
                      onClick={(e) => handleToggleColorPalette('new-spec', e)}
                      className="pf-spec-swatch-btn"
                      title="Click to open color palette"
                      aria-label="Color palette for new specification"
                    >
                      <span
                        className="pf-spec-swatch-circle"
                        style={{ background: resolveSwatchBackground(newSpecValue, newSpecHex) }}
                      />
                      <svg className="w-2.5 h-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <input
                      type="text"
                      value={newSpecValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewSpecValue(val);
                        const suggested = suggestHexForColorName(val);
                        if (suggested) setNewSpecHex(suggested);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewSpec();
                        }
                      }}
                      placeholder="Color (e.g. Black, Maroon)"
                      className="pf-spec-input flex-1 min-w-0"
                    />

                    {/* Color Palette Popover for new spec */}
                    {activeColorPaletteId === 'new-spec' && (
                      <div
                        className={`pf-color-popover${popoverPlacement === 'top' ? ' pf-color-popover--top' : ''}`}
                        ref={colorPaletteRef}
                      >
                        <div className="pf-color-popover-header">
                          <span className="pf-color-popover-title">Color Palette</span>
                          <button
                            type="button"
                            onClick={() => setActiveColorPaletteId(null)}
                            className="pf-color-popover-close"
                            aria-label="Close palette"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="pf-color-grid">
                          {POPULAR_COLOR_PALETTE.map((color) => (
                            <button
                              key={color.name}
                              type="button"
                              onClick={() => {
                                setNewSpecValue(color.name);
                                if (color.hex.startsWith('#')) setNewSpecHex(color.hex);
                                setActiveColorPaletteId(null);
                              }}
                              className="pf-color-swatch-item"
                              style={{ background: color.hex }}
                              title={color.name}
                              aria-label={color.name}
                            />
                          ))}
                        </div>
                        <div className="pf-color-custom-section">
                          <label className="pf-color-native-picker" title="Pick custom color">
                            <input
                              type="color"
                              value={normalizeHexColor(newSpecHex) || suggestHexForColorName(newSpecValue) || '#14120F'}
                              onChange={(e) => setNewSpecHex(e.target.value)}
                            />
                          </label>
                          <input
                            type="text"
                            value={newSpecHex}
                            onChange={(e) => setNewSpecHex(e.target.value)}
                            placeholder="#HEX"
                            className="pf-spec-input pf-color-hex-input"
                            maxLength={7}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewSpec();
                      }
                    }}
                    placeholder="Value (e.g. 18K Gold PVD)"
                    className="pf-spec-input flex-1 min-w-0"
                  />
                )}
                <button
                  type="button"
                  onClick={handleAddNewSpec}
                  disabled={!newSpecName.trim() || !newSpecValue.trim()}
                  className="pf-spec-add-btn"
                  title="Add specification"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Variants - with inline dropdown form */}
        <div className="pf-card w-full">
          <div className="pf-card__head pf-card__head--row w-full">
            <div>
              <h3>{isEditMode ? 'Additional Variants' : 'Product Variants'}</h3>
              <p>{isEditMode ? 'variants[1+] · each has its own ProductCode, price, images' : 'e.g., different colors or sizes — each needs a unique ProductCode'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAddVariant || onGenerateVariant}
                disabled={actionLoading && isEditMode}
                className="pf-chip-btn pf-chip-btn--indigo inline-flex items-center gap-1.5 font-medium cursor-pointer"
                title="Create and add another variant in sequence"
              >
                <span>+ Add Variant</span>
              </button>
            </div>
          </div>
          <div className="pf-card__body space-y-3 w-full">
            {actionError && isEditMode && (
              <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">❌ {actionError}</p>
              </div>
            )}

            {/* When adding a new variant (+ Add Variant clicked) */}
            {showVariantForm && editingVariantIndex === null && (
              <div className="pf-variant-dropdown-panel mb-3 w-full" ref={variantDropdownRef}>
                <VariantModal
                  inline
                  listingPrefix={listingPrefix}
                  variantForm={variantForm}
                  setVariantForm={setVariantForm}
                  editingVariantIndex={editingVariantIndex}
                  onSave={onSaveVariant}
                  onClose={onCloseVariantForm}
                  getDiscountPercentage={getDiscountPercentage}
                  isSaving={variantSaving}
                  saveError={variantSaveError}
                  isEditMode={isEditMode}
                  setFormData={setFormData}
                  formData={formData}
                />
              </div>
            )}

            {allVariantsList.length === 0 ? (
              <div className="pf-empty-box w-full">
                <p>No variants configured</p>
              </div>
            ) : (
              <div className="space-y-3 w-full">
                {allVariantsList.map((variant) => {
                  const summary = formatAttributesSummary(variant.attributes)
                  const isExpanded = showVariantForm && editingVariantIndex === variant.realIndex

                  return (
                    <div
                      key={variant.isPrimary ? 'primary-variant' : (variant.code || `v-${variant.realIndex}`)}
                      className={`pf-variant-card pf-variant-row-card w-full ${!variant.isActive ? 'is-inactive' : ''}`}
                    >
                      <div
                        className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap w-full cursor-pointer select-none"
                        onClick={() => handleVariantChevronClick(variant)}
                      >
                        {/* Left: Badge + Title + Attributes */}
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="pf-variant-num-badge">
                            {variant.displayIndex}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 text-sm tracking-tight">
                                Variant {variant.displayIndex}
                              </span>
                              {variant.isPrimary && (
                                <span className="pf-variant-primary-badge">
                                  PRIMARY
                                </span>
                              )}
                              {variant.code ? (
                                <span className="pf-variant-code-badge">
                                  {variant.code}
                                </span>
                              ) : null}
                            </div>
                            {summary ? (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {summary}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Right: Price + Stock + Active + Chevron + Delete */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 text-sm">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span>Price:</span>
                            <span className="font-bold text-gray-900 text-sm">
                              {variant.price && Number(variant.price) > 0
                                ? formatIndianRupee(variant.price)
                                : '—'}
                            </span>
                            <span className="text-gray-300 mx-1">|</span>
                            <span>Stock:</span>
                            <span className="font-bold text-gray-900 text-sm">
                              {variant.stock !== '' && variant.stock != null ? variant.stock : '0'}
                            </span>
                          </div>

                          <label
                            className="pf-variant-active-check"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(variant.isActive)}
                              onChange={() => handleVariantToggleActive(variant)}
                              disabled={actionLoading && isEditMode}
                            />
                            <span>Active</span>
                          </label>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVariantChevronClick(variant)
                            }}
                            disabled={actionLoading && isEditMode}
                            className="pf-variant-chevron-btn"
                            title={isExpanded ? 'Collapse variant details' : 'Expand variant details'}
                            aria-label={isExpanded ? 'Collapse variant details' : 'Expand variant details'}
                          >
                            <svg
                              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {!variant.isPrimary ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setVariantToDelete(variant)
                              }}
                              disabled={actionLoading && isEditMode}
                              title="Delete variant"
                              aria-label="Delete variant"
                              className="pf-spec-delete-btn"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          ) : (
                            <div className="w-7 h-7 shrink-0 hidden sm:block" />
                          )}
                        </div>
                      </div>

                      {/* Expanded inline editor for this variant */}
                      {isExpanded && (
                        <div className="mt-3.5 pt-3.5 border-t border-gray-100 w-full" ref={variantDropdownRef}>
                          <VariantModal
                            inline
                            listingPrefix={listingPrefix}
                            variantForm={variantForm}
                            setVariantForm={setVariantForm}
                            editingVariantIndex={editingVariantIndex}
                            onSave={onSaveVariant}
                            onClose={onCloseVariantForm}
                            getDiscountPercentage={getDiscountPercentage}
                            isSaving={variantSaving}
                            saveError={variantSaveError}
                            isEditMode={isEditMode}
                            setFormData={setFormData}
                            formData={formData}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Radix UI Delete Confirmation Dialog */}
      <Dialog.Root
        open={Boolean(variantToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeletingVariant) setVariantToDelete(null)
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="pf-confirm-overlay" />
          <Dialog.Content className="pf-confirm-dialog" data-lenis-prevent>
            <Dialog.Close asChild>
              <button
                type="button"
                className="pf-confirm-close-btn"
                aria-label="Close"
                disabled={isDeletingVariant}
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>

            <div className="pf-confirm-badge-wrap">
              <div className="pf-confirm-badge">
                <Trash2 />
              </div>
            </div>

            <Dialog.Title className="pf-confirm-title">
              Delete Variant {variantToDelete?.displayIndex}?
            </Dialog.Title>

            <Dialog.Description className="pf-confirm-desc">
              Are you sure you want to delete this variant? This action cannot be undone and will permanently remove this variant.
            </Dialog.Description>

            {variantToDelete && (
              <div className="pf-confirm-preview">
                <div className="pf-confirm-preview-left">
                  <div className="pf-confirm-preview-badges">
                    <span className="pf-confirm-pill">
                      Variant {variantToDelete.displayIndex}
                    </span>
                    {variantToDelete.code ? (
                      <span className="pf-confirm-code">
                        {variantToDelete.code}
                      </span>
                    ) : null}
                  </div>
                  {formatAttributesSummary(variantToDelete.attributes) ? (
                    <p className="pf-confirm-preview-summary">
                      {formatAttributesSummary(variantToDelete.attributes)}
                    </p>
                  ) : null}
                </div>
                <div className="pf-confirm-preview-right">
                  <div className="pf-confirm-preview-price">
                    {variantToDelete?.price && Number(variantToDelete.price) > 0 ? formatIndianRupee(variantToDelete.price) : '—'}
                  </div>
                  <div className="pf-confirm-preview-stock">
                    Stock: {variantToDelete.stock}
                  </div>
                </div>
              </div>
            )}

            <div className="pf-confirm-actions">
              <button
                type="button"
                disabled={isDeletingVariant}
                onClick={() => setVariantToDelete(null)}
                className="pf-confirm-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingVariant}
                onClick={handleConfirmDeleteVariant}
                className="pf-confirm-delete-btn"
              >
                {isDeletingVariant ? (
                  <>
                    <span className="pf-confirm-spinner" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Variant</span>
                  </>
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

