// Shared_components/VariantModal.jsx

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import VariantCatalogFieldsSection from './VariantCatalogFieldsSection'
import { emptyVariantShippingForm } from '@/lib/variantCatalogForm'
import { parseQuantityInput, quantityFieldValue, MAX_VARIANT_IMAGES, SUFFIXED_PRODUCT_CODE_REGEX } from './utils'
import {
  isColorAttributeKey,
  isPlatingAttributeKey,
  PLATING_OPTIONS,
  normalizeHexColor,
  suggestHexForColorName,
  UNKNOWN_SWATCH_HEX,
} from '@/features/product/colorSwatch'

export const TAX_RATE_OPTIONS = [
  { value: 0, label: '0% (Nil Rated)' },
  { value: 3, label: '3% (GST)' },
  { value: 5, label: '5% (GST)' },
  { value: 12, label: '12% (GST)' },
  { value: 18, label: '18% (GST)' },
  { value: 28, label: '28% (GST)' },
];

export const defaultVariant = {
  attributes: [
    { key: 'Color', value: '', hex: '' },
    { key: 'Plating', value: '', hex: '' },
  ],
  price: { base: '', sale: '', wholesaleBase: '', wholesaleSale: '' },
  inventory: { quantity: '', lowStockThreshold: 0, trackInventory: true },
  images: [],
  isActive: true,
  ProductCode: '',
  hsnCode: '',
  taxRate: '',
  isFragile: false,
  wholesale: false,
  minimumOrderQuantity: 1,
  channelVisibility: { ecomm: 'active', wholesale: 'draft' },
  title: '',
  description: '',
  shipping: emptyVariantShippingForm(),
};

const VariantModal = ({
  listingPrefix,
  variantForm,
  setVariantForm,
  editingVariantIndex,
  onSave,
  onClose,
  getDiscountPercentage,
  isSaving = false,
  saveError = null,
  inline = false,
  isEditMode = false,
  setFormData,
  formData = null,
}) => {
  const [variantImageDragging, setVariantImageDragging] = useState(false);
  const isEditing = editingVariantIndex !== null;
  const isCodeLocked = Boolean(isEditMode && isEditing && editingVariantIndex !== 'primary');

  // Ensure Color and Plating fields are always present in the attributes list
  useEffect(() => {
    const attrs = variantForm?.attributes || []
    const hasColor = attrs.some((a) => (a?.key || '').trim().toLowerCase() === 'color')
    const hasPlating = attrs.some((a) => (a?.key || '').trim().toLowerCase() === 'plating')

    if (!hasColor || !hasPlating) {
      setVariantForm?.((prev) => {
        const curAttrs = (prev?.attributes || []).filter((a) => (a?.key || '').trim() || (a?.value || '').trim())
        const curHasColor = curAttrs.some((a) => (a?.key || '').trim().toLowerCase() === 'color')
        const curHasPlating = curAttrs.some((a) => (a?.key || '').trim().toLowerCase() === 'plating')

        const next = [...curAttrs]
        if (!curHasColor) {
          next.unshift({ key: 'Color', value: '', hex: '' })
        }
        if (!curHasPlating) {
          const colorIdx = next.findIndex((a) => (a?.key || '').trim().toLowerCase() === 'color')
          if (colorIdx !== -1) {
            next.splice(colorIdx + 1, 0, { key: 'Plating', value: '', hex: '' })
          } else {
            next.push({ key: 'Plating', value: '', hex: '' })
          }
        }
        return { ...prev, attributes: next }
      })
    }
  }, [editingVariantIndex]);

  const syncAttrsToParentForm = (nextAttrs) => {
    if (!setFormData) return
    const isPrimary = editingVariantIndex === 'primary' || editingVariantIndex === -1 || (isEditMode && editingVariantIndex === 0)
    setFormData((p) => {
      const variants = [...(p?.variants || [])]
      if (isPrimary) {
        if (variants[0]) {
          variants[0] = { ...variants[0], attributes: nextAttrs }
        }
        return { ...p, attributes: nextAttrs, variants }
      } else if (typeof editingVariantIndex === 'number' && variants[editingVariantIndex]) {
        variants[editingVariantIndex] = { ...variants[editingVariantIndex], attributes: nextAttrs }
        return { ...p, variants }
      }
      return p
    })
  }

  const addVariantAttribute = () => {
    let nextKey = ''
    try {
      const stored = JSON.parse(localStorage.getItem('admin_last_variant_attribute_keys') || '[]')
      const currentKeys = new Set(variantForm.attributes.map(a => (a.key || '').trim().toLowerCase()))
      const unused = stored.find(k => k && !currentKeys.has(String(k).trim().toLowerCase()))
      if (unused) nextKey = unused
    } catch {}
    setVariantForm(prev => {
      const nextAttrs = [...prev.attributes, { key: nextKey, value: '', hex: '' }]
      syncAttrsToParentForm(nextAttrs)
      return { ...prev, attributes: nextAttrs }
    })
  };

  const removeVariantAttribute = (index) =>
    setVariantForm(prev => {
      const nextAttrs = prev.attributes.filter((_, i) => i !== index)
      syncAttrsToParentForm(nextAttrs)
      return { ...prev, attributes: nextAttrs }
    });

  const updateVariantAttribute = (index, field, value) =>
    setVariantForm((prev) => {
      const nextAttrs = prev.attributes.map((attr, i) => {
        if (i !== index) return attr
        const next = { ...attr, [field]: value }
        if (field === 'value' && isColorAttributeKey(next.key)) {
          const existingHex = normalizeHexColor(next.hex)
          if (!existingHex) {
            const suggested = suggestHexForColorName(value)
            if (suggested) next.hex = suggested
          }
        }
        if (field === 'hex') {
          const normalized = normalizeHexColor(value)
          next.hex = normalized || String(value || '').trim()
        }
        return next
      })
      syncAttrsToParentForm(nextAttrs)
      return { ...prev, attributes: nextAttrs }
    });

  const handleVariantImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...variantForm.images];
    files.forEach((file, index) => {
      if (newImages.length < MAX_VARIANT_IMAGES) {
        const reader = new FileReader();
        const imageId = `vimg-${Date.now()}-${index}`;
        reader.onloadend = () => {
          newImages.push({ id: imageId, url: reader.result, file, name: file.name, isMain: newImages.length === 0 });
          setVariantForm(prev => ({ ...prev, images: [...newImages] }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeVariantImage = (imageId) => {
    const newImages = variantForm.images.filter(img => (img.id || img.url) !== imageId);
    if (variantForm.images.find(img => (img.id || img.url) === imageId)?.isMain && newImages.length > 0) {
      newImages[0] = { ...newImages[0], isMain: true };
    }
    setVariantForm(prev => ({ ...prev, images: newImages }));
  };

  const setVariantMainImage = (imageId) =>
    setVariantForm(prev => ({
      ...prev,
      images: prev.images.map(img => ({ ...img, isMain: (img.id || img.url) === imageId }))
    }));

  // SINGLE SOURCE OF TRUTH: check wholesale eligibility from price.wholesaleBase
  const isWholesaleEligible = () => {
    return variantForm.wholesale && variantForm.price?.wholesaleBase && parseFloat(variantForm.price.wholesaleBase) > 0;
  };

  const isWholesaleMoqUnmet = () => {
    if (!variantForm.wholesale) return false;
    if (variantForm.inventory?.trackInventory === false) return false;

    const quantity = Number(variantForm.inventory?.quantity ?? 0);
    const moq = Number(variantForm.minimumOrderQuantity ?? 1);

    return Number.isFinite(quantity) && Number.isFinite(moq) && moq > quantity;
  };

  const handleSave = () => {
    const ProductCode = (variantForm.ProductCode ?? '').toString().trim();

    if (!ProductCode) {
      toast.error('ProductCode is required');
      return;
    }
    {
      const m = ProductCode.toUpperCase().match(SUFFIXED_PRODUCT_CODE_REGEX);
      const seq = m ? Number(m[2]) : NaN;
      if (!m || !Number.isInteger(seq) || seq < 1) {
        toast.error("ProductCode must be BASE-N (e.g., 3897-1 or 3897-01)");
        return;
      }
    }
    if (!variantForm.price.base) {
      toast.error('Please enter base price for this variant');
      return;
    }

    const base = parseFloat(variantForm.price.base) || 0;
    const sale = (variantForm.price.sale !== '' && variantForm.price.sale != null && variantForm.price.sale !== 'null')
      ? parseFloat(variantForm.price.sale)
      : null;

    if (base <= 0) {
      toast.error('Base price must be greater than 0');
      return;
    }
    if (sale !== null && sale >= base) {
      toast.error('Sale price must be less than base price');
      return;
    }

    if (variantForm.wholesale) {
      const wholesaleBase = parseFloat(variantForm.price.wholesaleBase) || 0;
      if (wholesaleBase <= 0) {
        toast.error('Wholesale base price is required and must be greater than 0');
        return;
      }
      if (!variantForm.minimumOrderQuantity || parseInt(variantForm.minimumOrderQuantity) < 1) {
        toast.error('Minimum Order Quantity (MOQ) must be at least 1');
        return;
      }
      const wholesaleSale = (variantForm.price.wholesaleSale !== '' && variantForm.price.wholesaleSale != null)
        ? parseFloat(variantForm.price.wholesaleSale)
        : null;
      if (wholesaleSale !== null && wholesaleSale >= wholesaleBase) {
        toast.error('Wholesale sale price must be less than wholesale base price');
        return;
      }
    }

    const validAttributes = variantForm.attributes
      .filter((a) => a.key.trim() && a.value.trim())
      .map((a) => {
        const attr = { key: a.key.trim(), value: a.value.trim() }
        if (isColorAttributeKey(attr.key)) {
          const hex = normalizeHexColor(a.hex)
          if (hex) attr.hex = hex
        }
        return attr
      })

    // Remember attribute keys so future variants automatically show the keys with blank values
    const usedKeys = validAttributes.map(a => a.key.trim()).filter(Boolean);
    if (usedKeys.length) {
      try {
        const existing = JSON.parse(localStorage.getItem('admin_last_variant_attribute_keys') || '[]');
        const merged = [...new Set([...usedKeys, ...existing])];
        localStorage.setItem('admin_last_variant_attribute_keys', JSON.stringify(merged));
      } catch {}
    }

    // CRITICAL: Pass price object with wholesaleBase INSIDE, NOT at root level
    onSave({
      ...variantForm,
      ProductCode: ProductCode,
      hsnCode: (variantForm.hsnCode ?? '').toString().trim(),
      taxRate: variantForm.taxRate !== undefined && variantForm.taxRate !== '' ? parseFloat(variantForm.taxRate) : '',
      isFragile: Boolean(variantForm.isFragile),
      shipping: variantForm.shipping || emptyVariantShippingForm(),
      attributes: validAttributes,
      price: {
        base: base,
        sale: sale,
        wholesaleBase: variantForm.wholesale ? (parseFloat(variantForm.price.wholesaleBase) || 0) : undefined,
        wholesaleSale: variantForm.wholesale ? (variantForm.price.wholesaleSale ? parseFloat(variantForm.price.wholesaleSale) : null) : undefined,
      },
      minimumOrderQuantity: variantForm.wholesale ? (parseInt(variantForm.minimumOrderQuantity) || 1) : 1,
      channelVisibility: {
        ecomm: variantForm.channelVisibility?.ecomm || 'active',
        wholesale: isWholesaleEligible() ? 'active' : 'draft',
      },
    });
  };

  const cardContent = (
    <div className={`pf-variant-card ${inline ? 'pf-variant-card--inline' : ''}`}>
      <div className="pf-variant-card__head">
          <div>
            <h3>{isEditing ? (editingVariantIndex === 0 || editingVariantIndex === 'primary' ? 'Variant 1 (Primary)' : 'Edit Variant') : 'Add New Variant'}</h3>
            <p>{isEditing ? 'Set ProductCode, attributes, price & stock' : 'Set ProductCode, attributes, price & stock'}</p>
          </div>
          <button type="button" onClick={onClose} className="pf-variant-close" aria-label="Close">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="pf-variant-card__body">
          <div className="pf-variant-section">
            <div className="pf-variant-field">
              <div className="flex items-center justify-between mb-1">
                <label className="pf-variant-label mb-0">
                  Variant Product Code <span className="pf-req">*</span>
                  {isCodeLocked ? <span className="pf-variant-locked ml-2">🔒 Locked</span> : null}
                </label>
                {!isCodeLocked && (
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      const code = (editingVariantIndex === 'primary' || editingVariantIndex === -1 || editingVariantIndex === null)
                        ? `${rand}-1`
                        : `${rand}-${(editingVariantIndex ?? 0) + 2}`;
                      setVariantForm((prev) => ({ ...prev, ProductCode: code }));
                      if (editingVariantIndex === 'primary' || editingVariantIndex === -1) {
                        setFormData?.((prev) => ({ ...prev, ProductCode: code }));
                      }
                    }}
                    className="pf-autogen-btn text-xs"
                    title="Generate a unique product code"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    <span>Auto-generate</span>
                  </button>
                )}
              </div>
              <div className={`pf-code-group${isCodeLocked ? ' is-disabled' : ''}`}>
                {listingPrefix ? (
                  <span className="pf-code-prefix" title="Configured listing prefix">
                    {listingPrefix}
                  </span>
                ) : null}
                <input
                  type="text"
                  value={variantForm.ProductCode ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVariantForm((prev) => ({ ...prev, ProductCode: val }));
                    if (editingVariantIndex === 'primary' || editingVariantIndex === -1) {
                      setFormData?.((prev) => ({ ...prev, ProductCode: val }));
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim().toUpperCase();
                    if (val) {
                      const formatted = /-\d+$/.test(val) ? val : `${val}-1`;
                      setVariantForm((prev) => ({ ...prev, ProductCode: formatted }));
                      if (editingVariantIndex === 'primary' || editingVariantIndex === -1) {
                        setFormData?.((prev) => ({ ...prev, ProductCode: formatted }));
                      }
                    }
                  }}
                  disabled={isCodeLocked}
                  className="pf-code-input"
                  placeholder="e.g., 788-1"
                />
              </div>
            </div>
          </div>

          <div className="pf-variant-section">
            <div className="pf-variant-row">
              <label className="pf-variant-label">
                Attributes <span className="pf-variant-optional">(optional)</span>
              </label>
              <button type="button" onClick={addVariantAttribute} className="pf-variant-chip">+ Add</button>
            </div>
            <div className="pf-variant-attr-list">
              {variantForm.attributes.map((attr, index) => {
                const isColor = isColorAttributeKey(attr.key)
                const isPlating = isPlatingAttributeKey(attr.key)
                const pickerHex =
                  normalizeHexColor(attr.hex) ||
                  suggestHexForColorName(attr.value) ||
                  UNKNOWN_SWATCH_HEX
                return (
                  <div
                    key={index}
                    className={`pf-variant-attr-row${isColor ? ' pf-variant-attr-row--color' : ''}`}
                  >
                    <input
                      type="text"
                      value={attr.key}
                      onChange={(e) => updateVariantAttribute(index, 'key', e.target.value)}
                      className="pf-variant-input"
                      placeholder="Key (e.g., Color)"
                    />
                    {isPlating ? (
                      <select
                        value={attr.value || ''}
                        onChange={(e) => updateVariantAttribute(index, 'value', e.target.value)}
                        className="pf-variant-input pf-variant-select"
                      >
                        <option value="">Select Plating</option>
                        {PLATING_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => updateVariantAttribute(index, 'value', e.target.value)}
                        className="pf-variant-input"
                        placeholder={isColor ? "Color (e.g., Maroon)" : "Value (e.g., Ochre)"}
                      />
                    )}
                    {isColor ? (
                      <>
                        <label
                          className="pf-variant-swatch-picker"
                          title="Swatch color"
                          aria-label={`Swatch for ${attr.value || 'color'}`}
                        >
                          <input
                            type="color"
                            value={pickerHex}
                            onChange={(e) =>
                              updateVariantAttribute(index, 'hex', e.target.value)
                            }
                          />
                        </label>
                        <input
                          type="text"
                          value={attr.hex || ''}
                          onChange={(e) =>
                            updateVariantAttribute(index, 'hex', e.target.value)
                          }
                          className="pf-variant-input pf-variant-hex-input"
                          placeholder="#CC7722"
                          spellCheck={false}
                          aria-label="Color hex"
                        />
                      </>
                    ) : null}
                    {variantForm.attributes.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeVariantAttribute(index)}
                        className="pf-variant-remove"
                        aria-label="Remove attribute"
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
            <p className="pf-variant-attr-hint">
              For Color / Shade, set the swatch hex so the storefront palette matches the real color.
            </p>
          </div>

          <div className="pf-variant-panel pf-variant-panel--ecom">
            <div>
              <label>Ecom Visibility</label>
              <p>Show on ecommerce storefront</p>
            </div>
            <button
              type="button"
              aria-label="Toggle ecom visibility"
              onClick={() => setVariantForm((prev) => ({
                ...prev,
                channelVisibility: {
                  ...prev.channelVisibility,
                  ecomm: prev.channelVisibility?.ecomm === 'active' ? 'draft' : 'active',
                },
              }))}
              className={`pf-toggle pf-toggle--ecom${variantForm.channelVisibility?.ecomm === 'active' ? ' is-on' : ''}`}
            >
              <span className="pf-toggle__knob" />
            </button>
          </div>

          <div className="pf-variant-section">
            <div>
              <h4 className="pf-variant-label">Pricing &amp; Inventory</h4>
              <p className="pf-variant-hint">Pricing, wholesale rules, and inventory for this variant</p>
            </div>

            <div className="pf-variant-grid">
              <div className="pf-variant-field">
                <label>Base Price (₹) <span className="pf-req">*</span></label>
                <input
                  type="number"
                  value={variantForm.price.base}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVariantForm((prev) => ({ ...prev, price: { ...prev.price, base: val } }));
                    if (editingVariantIndex === 'primary' || editingVariantIndex === -1 || (isEditMode && editingVariantIndex === 0)) {
                      setFormData?.((prev) => ({ ...prev, price: { ...prev.price, base: val } }));
                    }
                  }}
                  className="pf-variant-input"
                  placeholder="29999"
                />
              </div>
              <div className="pf-variant-field">
                <label>Sale Price (₹)</label>
                <input
                  type="number"
                  value={variantForm.price.sale ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVariantForm((prev) => ({ ...prev, price: { ...prev.price, sale: val } }));
                    if (editingVariantIndex === 'primary' || editingVariantIndex === -1 || (isEditMode && editingVariantIndex === 0)) {
                      setFormData?.((prev) => ({ ...prev, price: { ...prev.price, sale: val } }));
                    }
                  }}
                  className="pf-variant-input"
                  placeholder="19999"
                />
              </div>
            </div>
            {variantForm.price.base && variantForm.price.sale && (
              <div className="mt-2.5 p-2.5 bg-blue-50 rounded-lg flex items-center gap-3">
                <span className="text-gray-400 line-through text-xs font-mono">₹{variantForm.price.base}</span>
                <span className="text-sm font-bold text-gray-900 font-mono">₹{variantForm.price.sale}</span>
                {Number(variantForm.price.sale) < Number(variantForm.price.base) && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    {Math.round(((Number(variantForm.price.base) - Number(variantForm.price.sale)) / Number(variantForm.price.base)) * 100)}% OFF
                  </span>
                )}
              </div>
            )}

            <div className="pf-variant-section--divided">
              <div className="pf-variant-row">
                <div>
                  <label className="pf-variant-label">Wholesale Pricing</label>
                  <p className="pf-variant-hint">Enable bulk pricing for wholesalers</p>
                </div>
                <button
                  type="button"
                  aria-label="Toggle wholesale pricing"
                  onClick={() => setVariantForm((prev) => ({ ...prev, wholesale: !prev.wholesale }))}
                  className={`pf-toggle pf-toggle--wholesale${variantForm.wholesale ? ' is-on' : ''}`}
                >
                  <span className="pf-toggle__knob" />
                </button>
              </div>

              <div className={`pf-variant-panel${isWholesaleEligible() ? ' pf-variant-panel--wholesale-on' : ' pf-variant-panel--muted'}`}>
                <span className="pf-variant-panel__title">Wholesale Visibility</span>
                <span className={`pf-main__badge${isWholesaleEligible() ? ' is-active' : ''}`}>
                  {isWholesaleEligible() ? 'Active' : 'Ineligible'}
                </span>
              </div>

              {variantForm.wholesale ? (
                <div className="pf-variant-wholesale-box">
                  <div className="pf-variant-grid">
                    <div className="pf-variant-field">
                      <label>Wholesale Base Price (₹) <span className="pf-req">*</span></label>
                      <input type="number" value={variantForm.price.wholesaleBase || ''} onChange={(e) => setVariantForm((prev) => ({ ...prev, price: { ...prev.price, wholesaleBase: e.target.value } }))} className="pf-variant-input" placeholder="25000" />
                    </div>
                    <div className="pf-variant-field">
                      <label>Wholesale Sale Price (₹)</label>
                      <input type="number" value={variantForm.price.wholesaleSale || ''} onChange={(e) => setVariantForm((prev) => ({ ...prev, price: { ...prev.price, wholesaleSale: e.target.value } }))} className="pf-variant-input" placeholder="23000" />
                    </div>
                  </div>
                  <div className="pf-variant-field">
                    <label>Minimum Order Quantity (MOQ) <span className="pf-req">*</span></label>
                    <input type="number" min="1" value={variantForm.minimumOrderQuantity || 1} onChange={(e) => setVariantForm((prev) => ({ ...prev, minimumOrderQuantity: parseInt(e.target.value, 10) || 1 }))} className="pf-variant-input" placeholder="Minimum quantity for wholesale price" />
                  </div>
                  {isWholesaleMoqUnmet() ? (
                    <p className="pf-main__warn">
                      Wholesale warning: MOQ ({variantForm.minimumOrderQuantity ?? 1}) is greater than stock ({variantForm.inventory?.quantity ?? 0})
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="pf-variant-section--divided">
              <div className="pf-variant-row">
                <div>
                  <label className="pf-variant-label">Track Inventory</label>
                  <p className="pf-variant-hint">Manage stock and alerts for this variant</p>
                </div>
                <button
                  type="button"
                  aria-label="Toggle inventory tracking"
                  onClick={() => setVariantForm((prev) => ({
                    ...prev,
                    inventory: { ...prev.inventory, trackInventory: !prev.inventory.trackInventory },
                  }))}
                  className={`pf-toggle pf-toggle--inventory${variantForm.inventory.trackInventory ? ' is-on' : ''}`}
                >
                  <span className="pf-toggle__knob" />
                </button>
              </div>
              {variantForm.inventory.trackInventory ? (
                <div className="pf-variant-grid mt-2">
                  <div className="pf-variant-field">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={quantityFieldValue(variantForm.inventory.quantity)}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        setVariantForm((prev) => ({
                          ...prev,
                          inventory: {
                            ...prev.inventory,
                            quantity: parseQuantityInput(e.target.value),
                          },
                        }))
                      }
                      className="pf-variant-input"
                      placeholder="Enter stock qty"
                    />
                  </div>
                  <div className="pf-variant-field">
                    <label>Low Stock Alert</label>
                    <input
                      type="number"
                      min={0}
                      value={variantForm.inventory.lowStockThreshold}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10)
                        setVariantForm((prev) => ({
                          ...prev,
                          inventory: {
                            ...prev.inventory,
                            lowStockThreshold: Number.isFinite(n) && n >= 0 ? n : 0,
                          },
                        }))
                      }}
                      className="pf-variant-input"
                      placeholder="0"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <VariantCatalogFieldsSection
            title={variantForm.title ?? ''}
            description={variantForm.description ?? ''}
            placeholderTitle={formData?.title || formData?.name || ''}
            placeholderDescription={formData?.description || ''}
            onTitleChange={(value) => setVariantForm((prev) => ({ ...prev, title: value }))}
            onDescriptionChange={(value) => setVariantForm((prev) => ({ ...prev, description: value }))}
          />

          {/* Shipping Dimensions & Weight */}
          <div className="pf-variant-section pf-variant-section--divided">
            <div>
              <h4 className="pf-variant-label">Weight &amp; Dimensions</h4>
              <p className="pf-variant-hint">Package weight and dimensions for this variant (used for shipping calculation)</p>
            </div>

            <div className="pf-variant-field">
              <label>Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={variantForm.shipping?.weight ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const nextShipping = {
                    ...(variantForm.shipping || {}),
                    weight: val,
                    dimensions: variantForm.shipping?.dimensions || { length: '', width: '', height: '' },
                  };
                  setVariantForm((prev) => ({ ...prev, shipping: nextShipping }));
                  if (editingVariantIndex === 'primary' || editingVariantIndex === -1 || (isEditMode && editingVariantIndex === 0)) {
                    setFormData?.((prev) => ({
                      ...prev,
                      shipping: {
                        ...(prev.shipping || {}),
                        weight: val === '' ? '' : parseFloat(val) || 0,
                      },
                    }));
                  }
                }}
                className="pf-variant-input pf-variant-input--half"
                placeholder="0.5"
              />
            </div>

            <div className="pf-variant-field mt-3">
              <label>Dimensions (cm)</label>
              <div className="pf-variant-grid pf-variant-grid--3">
                {['length', 'width', 'height'].map((dim) => (
                  <input
                    key={dim}
                    type="number"
                    step="0.1"
                    min="0"
                    value={variantForm.shipping?.dimensions?.[dim] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nextShipping = {
                        ...(variantForm.shipping || {}),
                        dimensions: {
                          ...(variantForm.shipping?.dimensions || { length: '', width: '', height: '' }),
                          [dim]: val,
                        },
                      };
                      setVariantForm((prev) => ({ ...prev, shipping: nextShipping }));
                      if (editingVariantIndex === 'primary' || editingVariantIndex === -1 || (isEditMode && editingVariantIndex === 0)) {
                        setFormData?.((prev) => ({
                          ...prev,
                          shipping: {
                            ...(prev.shipping || {}),
                            dimensions: {
                              ...(prev.shipping?.dimensions || {}),
                              [dim]: val === '' ? '' : parseFloat(val) || 0,
                            },
                          },
                        }));
                      }
                    }}
                    className="pf-variant-input"
                    placeholder={dim.charAt(0).toUpperCase() + dim.slice(1)}
                  />
                ))}
              </div>
              <p className="pf-variant-attr-hint">Length × Width × Height in cm. Used for delivery charge calculation and Shiprocket.</p>
            </div>
          </div>

          <div className="pf-variant-section">
            <label className="pf-variant-label">Images (up to {MAX_VARIANT_IMAGES})</label>
            <label
              className={`pf-variant-dropzone${variantImageDragging ? ' is-drag' : ''}${variantForm.images.length >= MAX_VARIANT_IMAGES ? ' is-full' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setVariantImageDragging(true) }}
              onDragLeave={() => setVariantImageDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setVariantImageDragging(false)
                handleVariantImageUpload({ target: { files: e.dataTransfer.files } })
              }}
            >
              <input type="file" multiple accept="image/*" onChange={handleVariantImageUpload} className="pf-variant-file" disabled={variantForm.images.length >= MAX_VARIANT_IMAGES} />
              <p>Click or drop images ({variantForm.images.length}/{MAX_VARIANT_IMAGES})</p>
            </label>
            {variantForm.images.length > 0 ? (
              <div className="pf-variant-thumbs">
                {variantForm.images.map((image) => (
                  <div key={image.id || image.url} className={`pf-variant-thumb${image.isMain ? ' is-main' : ''}`}>
                    <img src={image.url} alt="" />
                    <button type="button" onClick={() => setVariantMainImage(image.id || image.url)} className="pf-variant-thumb__star" aria-label="Set as main">★</button>
                    <button type="button" onClick={() => removeVariantImage(image.id || image.url)} className="pf-variant-thumb__remove" aria-label="Remove image">✕</button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="pf-variant-card__footer">
          {saveError ? (
            <div className="pf-variant-error" role="alert">{saveError}</div>
          ) : null}
          <div className="pf-variant-card__actions">
            <button type="button" onClick={onClose} disabled={isSaving} className="pf-variant-btn pf-variant-btn--cancel">Cancel</button>
            <button type="button" onClick={handleSave} disabled={isSaving} className="pf-variant-btn pf-variant-btn--save">
              {isSaving ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
            </button>
          </div>
        </div>
      </div>
  )

  if (inline) {
    return cardContent
  }

  return <div className="pf-variant-overlay">{cardContent}</div>
}

export default VariantModal

