// Shared_components/VariantModal.jsx

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import VariantCatalogFieldsSection from './VariantCatalogFieldsSection'
import { emptyVariantShippingForm } from '@/lib/variantCatalogForm'
import { parseQuantityInput, quantityFieldValue, MAX_VARIANT_IMAGES, SUFFIXED_PRODUCT_CODE_REGEX } from './utils'
import { applyImagesToImageGroup, collectVariantAttrLists, imageGroupToken, resolveImageAxisKey } from '@/features/product/imageAxis'
import {
  isColorAttributeKey,
  isPlatingAttributeKey,
  PLATING_OPTIONS,
  normalizeHexColor,
  suggestHexForColorName,
  UNKNOWN_SWATCH_HEX,
  resolveSwatchBackground,
} from '@/features/product/colorSwatch'
import {
  ON_SALE_PRICE_HINT,
  ON_SALE_PRICE_LABEL,
  assertOnSalePrice,
} from '@/features/admin/utils/onSalePrice'

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
  price: { base: '', sale: '', onSale: '', wholesaleBase: '', wholesaleSale: '' },
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
  axisKeys = [],
}) => {
  const [variantImageDragging, setVariantImageDragging] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState(null);
  const isEditing = editingVariantIndex !== null;
  const isCodeLocked = Boolean(isEditMode && isEditing && editingVariantIndex !== 'primary');
  const isPrimary = editingVariantIndex === 'primary' || editingVariantIndex === -1 || (isEditMode && editingVariantIndex === 0);

  // If editing Variant 1 and variantForm.images is empty, ensure it receives images from formData
  useEffect(() => {
    if (isPrimary && (!variantForm?.images || variantForm.images.length === 0)) {
      const sourceImgs = (formData?.images && formData.images.length > 0)
        ? formData.images
        : (formData?.variants?.[0]?.images && formData.variants[0].images.length > 0)
          ? formData.variants[0].images
          : null;
      if (sourceImgs && sourceImgs.length > 0) {
        setVariantForm((prev) => {
          if (prev.images && prev.images.length > 0) return prev;
          return { ...prev, images: sourceImgs };
        });
      }
    }
  }, [isPrimary, formData?.images, formData?.variants]);

  const requiredAxisKeys = (Array.isArray(axisKeys) && axisKeys.length > 0)
    ? axisKeys.map((k) => String(k || '').trim()).filter(Boolean)
    : ['Color', 'Plating']
  const requiredAxisKeySet = new Set(requiredAxisKeys.map((k) => k.toLowerCase()))

  // Keep variation-axis keys present so SKUs stay matchable on the storefront.
  useEffect(() => {
    setVariantForm?.((prev) => {
      const curAttrs = (prev?.attributes || []).filter((a) => (a?.key || '').trim() || (a?.value || '').trim())
      const next = [...curAttrs]
      let changed = false
      for (const key of requiredAxisKeys) {
        const has = next.some((a) => (a?.key || '').trim().toLowerCase() === key.toLowerCase())
        if (!has) {
          next.push({ key, value: '', hex: '' })
          changed = true
        }
      }
      if (!changed) return prev
      return { ...prev, attributes: next }
    })
  }, [editingVariantIndex, requiredAxisKeys.join('|')]);

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
        if ((field === 'value' || field === 'key') && isColorAttributeKey(next.key)) {
          const suggested = suggestHexForColorName(next.value)
          if (suggested) {
            next.hex = suggested
          } else {
            const bg = resolveSwatchBackground(next.value)
            if (bg && typeof bg === 'string' && bg.startsWith('#')) {
              next.hex = bg
            }
          }
        }
        return next
      })
      syncAttrsToParentForm(nextAttrs)
      return { ...prev, attributes: nextAttrs }
    });

  const syncImagesToParentForm = (nextImages) => {
    if (!setFormData) return;
    setFormData((p) => applyImagesToImageGroup(p, variantForm?.attributes || p?.attributes, nextImages));
  };

  const handleVariantImageUpload = async (e) => {
    const rawFiles = Array.from(e.target?.files || []);
    if (!rawFiles.length) return;
    const currentImages = variantForm.images || [];
    const remaining = MAX_VARIANT_IMAGES - currentImages.length;
    if (remaining <= 0) {
      toast.error(`Maximum of ${MAX_VARIANT_IMAGES} images allowed.`);
      return;
    }
    const filesToLoad = rawFiles.slice(0, remaining);

    const readPromises = filesToLoad.map((file, idx) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        const imageId = `vimg-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
        reader.onloadend = () => {
          resolve({
            id: imageId,
            url: reader.result,
            file,
            name: file.name,
            isMain: false,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    try {
      const loaded = await Promise.all(readPromises);
      const updated = [...currentImages, ...loaded];
      if (!updated.some((img) => img.isMain) && updated.length > 0) {
        updated[0] = { ...updated[0], isMain: true };
      }
      setVariantForm((prev) => ({ ...prev, images: updated }));
      syncImagesToParentForm(updated);
      toast.success(`Added ${loaded.length} image${loaded.length > 1 ? 's' : ''}`);
    } catch {
      toast.error('Failed to upload image(s)');
    }
    if (e.target) e.target.value = '';
  };

  const removeVariantImage = (imageId) => {
    const remaining = (variantForm.images || []).filter((img) => (img.id || img.url) !== imageId);
    const wasMain = (variantForm.images || []).find((img) => (img.id || img.url) === imageId)?.isMain;
    if (wasMain && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isMain: true };
    }
    setVariantForm((prev) => ({ ...prev, images: remaining }));
    syncImagesToParentForm(remaining);
  };

  const setVariantMainImage = (imageId) => {
    const list = [...(variantForm.images || [])];
    const targetIdx = list.findIndex((img) => (img.id || img.url) === imageId);
    if (targetIdx === -1) return;

    // Move target image to front (#1 position) and mark as isMain
    const [targetImg] = list.splice(targetIdx, 1);
    const updated = [
      { ...targetImg, isMain: true },
      ...list.map((img) => ({ ...img, isMain: false })),
    ];
    setVariantForm((prev) => ({ ...prev, images: updated }));
    syncImagesToParentForm(updated);
    toast.success('Image set as primary (#1)');
  };

  const handleImageDragStart = (e, index) => {
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleImageDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverImageIndex !== index) {
      setDragOverImageIndex(index);
    }
  };

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  };

  const handleImageDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = draggedImageIndex;
    if (sourceIndex === null || sourceIndex === targetIndex) {
      setDraggedImageIndex(null);
      setDragOverImageIndex(null);
      return;
    }

    const reordered = [...(variantForm.images || [])];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    // Keep position #1 as primary (isMain)
    const updated = reordered.map((img, idx) => ({
      ...img,
      isMain: idx === 0,
    }));

    setVariantForm((prev) => ({ ...prev, images: updated }));
    syncImagesToParentForm(updated);
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
    toast.success('Sequence updated');
  };

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
      setActiveTab('basic');
      toast.error('ProductCode is required');
      return;
    }
    {
      const m = ProductCode.toUpperCase().match(SUFFIXED_PRODUCT_CODE_REGEX);
      const seq = m ? Number(m[2]) : NaN;
      if (!m || !Number.isInteger(seq) || seq < 1) {
        setActiveTab('basic');
        toast.error("ProductCode must be BASE-N (e.g., 3897-1 or 3897-01)");
        return;
      }
    }
    if (!variantForm.price.base) {
      setActiveTab('basic');
      toast.error('Please enter base price for this variant');
      return;
    }

    const base = parseFloat(variantForm.price.base) || 0;
    const sale = (variantForm.price.sale !== '' && variantForm.price.sale != null && variantForm.price.sale !== 'null')
      ? parseFloat(variantForm.price.sale)
      : null;

    if (base <= 0) {
      setActiveTab('basic');
      toast.error('Base price must be greater than 0');
      return;
    }
    if (sale !== null && sale >= base) {
      setActiveTab('basic');
      toast.error('Sale price must be less than base price');
      return;
    }

    let onSale = null;
    try {
      onSale = assertOnSalePrice(base, sale, variantForm.price.onSale);
    } catch (onSaleErr) {
      setActiveTab('basic');
      toast.error(onSaleErr.message);
      return;
    }

    if (variantForm.wholesale) {
      const wholesaleBase = parseFloat(variantForm.price.wholesaleBase) || 0;
      if (wholesaleBase <= 0) {
        setActiveTab('advanced');
        toast.error('Wholesale base price is required and must be greater than 0');
        return;
      }
      if (!variantForm.minimumOrderQuantity || parseInt(variantForm.minimumOrderQuantity) < 1) {
        setActiveTab('advanced');
        toast.error('Minimum Order Quantity (MOQ) must be at least 1');
        return;
      }
      const wholesaleSale = (variantForm.price.wholesaleSale !== '' && variantForm.price.wholesaleSale != null)
        ? parseFloat(variantForm.price.wholesaleSale)
        : null;
      if (wholesaleSale !== null && wholesaleSale >= wholesaleBase) {
        setActiveTab('advanced');
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
        onSale,
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
          <h3>{isEditing ? (isPrimary ? 'Variant 1 (Primary)' : `Edit Variant #${typeof editingVariantIndex === 'number' ? editingVariantIndex + 2 : ''}`) : 'Add New Variant'}</h3>
          <p>Configure option attributes, pricing, stock, photos, and shipping</p>
        </div>
        <button type="button" onClick={onClose} className="pf-variant-close" aria-label="Close" title="Close variant editor">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="pf-variant-card__body">
        {/* Product Code */}
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

            {/* Attributes */}
            <div className="pf-variant-section">
              <div className="pf-variant-row">
                <label className="pf-variant-label">
                  Attributes &amp; Options <span className="pf-variant-optional">(Color, Size, Plating)</span>
                </label>
                <button type="button" onClick={addVariantAttribute} className="pf-variant-chip">+ Add Option</button>
              </div>
              <div className="pf-variant-attr-list">
                {variantForm.attributes.map((attr, index) => {
                  const isColor = isColorAttributeKey(attr.key)
                  const isPlating = isPlatingAttributeKey(attr.key)
                  const isAxisAttr = requiredAxisKeySet.has(String(attr.key || '').trim().toLowerCase())
                  const pickerHex =
                    normalizeHexColor(attr.hex) ||
                    suggestHexForColorName(attr.value) ||
                    resolveSwatchBackground(attr.value) ||
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
                        disabled={isAxisAttr}
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
                          placeholder={isColor ? "Color (e.g., Maroon)" : "Value (e.g., XL)"}
                        />
                      )}
                      {isColor ? (
                        <span
                          className="pf-variant-swatch-preview"
                          style={{ background: pickerHex }}
                          title={`Color: ${attr.value || 'None'}`}
                          aria-label={`Color swatch for ${attr.value || 'color'}`}
                        />
                      ) : null}
                      {variantForm.attributes.length > 1 && !isAxisAttr ? (
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
                Options (Color, Size, Plating) identify this SKU on your storefront. Color swatches update automatically from the color name.
              </p>
            </div>

            {/* Pricing & Inventory */}
            <div className="pf-variant-section">
              <div>
                <h4 className="pf-variant-label">Pricing &amp; Inventory</h4>
                <p className="pf-variant-hint">Set variant retail price and available stock</p>
              </div>

              <div className="pf-variant-grid pf-variant-grid--3">
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
                <div className="pf-variant-field">
                  <label>{ON_SALE_PRICE_LABEL} (₹)</label>
                  <input
                    type="number"
                    value={variantForm.price.onSale ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVariantForm((prev) => ({ ...prev, price: { ...prev.price, onSale: val } }));
                      if (editingVariantIndex === 'primary' || editingVariantIndex === -1 || (isEditMode && editingVariantIndex === 0)) {
                        setFormData?.((prev) => ({ ...prev, price: { ...prev.price, onSale: val } }));
                      }
                    }}
                    className="pf-variant-input"
                    placeholder="80"
                  />
                  <p className="pf-variant-hint">{ON_SALE_PRICE_HINT}</p>
                </div>
              </div>
              {variantForm.price.base && variantForm.price.sale && (
                <div className="mt-2.5 p-2.5 bg-blue-50 rounded-lg flex items-center gap-3 flex-wrap">
                  <span className="text-gray-400 line-through text-xs font-mono">₹{variantForm.price.base}</span>
                  {variantForm.price.onSale !== '' && variantForm.price.onSale != null ? (
                    <>
                      <span className="text-gray-500 line-through text-xs font-mono">₹{variantForm.price.sale}</span>
                      <span className="text-sm font-bold text-gray-900 font-mono">₹{variantForm.price.onSale}</span>
                      {Number(variantForm.price.onSale) < Number(variantForm.price.base) && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          {Math.round(((Number(variantForm.price.base) - Number(variantForm.price.onSale)) / Number(variantForm.price.base)) * 100)}% OFF
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-bold text-gray-900 font-mono">₹{variantForm.price.sale}</span>
                      {Number(variantForm.price.sale) < Number(variantForm.price.base) && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          {Math.round(((Number(variantForm.price.base) - Number(variantForm.price.sale)) / Number(variantForm.price.base)) * 100)}% OFF
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Track Inventory */}
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
                      <label>Stock Quantity</label>
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
                      <label>Low Stock Alert Threshold</label>
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

            {/* Storefront Ecom Visibility */}
            <div className="pf-variant-panel pf-variant-panel--ecom">
              <div>
                <label>Ecom Storefront Visibility</label>
                <p>Allow customers to view and purchase this variant</p>
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

            {/* Photos & Media */}
            <div className="pf-variant-section">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="pf-variant-label mb-0">Look photos (up to {MAX_VARIANT_IMAGES})</label>
                <p className="text-xs text-gray-500 mt-0.5">
                  {(() => {
                    const lists = collectVariantAttrLists(formData)
                    const axis = resolveImageAxisKey(lists)
                    const token = imageGroupToken(variantForm?.attributes, axis)
                    const siblingCount = (formData?.variants || []).filter(
                      (v) => imageGroupToken(v?.attributes, axis) === token
                    ).length
                    const lookValue = axis
                      ? (variantForm?.attributes || []).find((a) => String(a?.key || '').toLowerCase() === String(axis).toLowerCase())?.value
                      : ''
                    if (siblingCount > 1 && lookValue) {
                      return `These photos apply to every ${axis} ${lookValue} size. Upload once — not per size.`
                    }
                    return 'Upload once for this look. Size / capacity rows share the same photos.'
                  })()}
                </p>
              </div>
              <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-1 rounded">
                {variantForm.images.length}/{MAX_VARIANT_IMAGES} photos
              </span>
            </div>

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
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleVariantImageUpload}
                className="pf-variant-file"
                disabled={variantForm.images.length >= MAX_VARIANT_IMAGES}
              />
              <div className="flex flex-col items-center justify-center gap-1 py-1">
                <svg className="w-6 h-6 text-indigo-500 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-700">
                  {variantForm.images.length >= MAX_VARIANT_IMAGES
                    ? `Maximum ${MAX_VARIANT_IMAGES} images reached`
                    : variantForm.images.length > 0
                    ? `Click or drop more images (${variantForm.images.length}/${MAX_VARIANT_IMAGES})`
                    : `Click or drop images (${variantForm.images.length}/${MAX_VARIANT_IMAGES})`}
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 10MB each</p>
              </div>
            </label>

            {variantForm.images.length > 0 ? (
              <div className="space-y-2 mt-3">
                <div className="pf-variant-thumbs">
                  {variantForm.images.map((image, index) => {
                    const isMain = Boolean(image.isMain || index === 0);
                    const isDragging = draggedImageIndex === index;
                    const isDragOver = dragOverImageIndex === index;

                    return (
                      <div
                        key={image.id || image.url || `img-${index}`}
                        draggable
                        onDragStart={(e) => handleImageDragStart(e, index)}
                        onDragOver={(e) => handleImageDragOver(e, index)}
                        onDragEnd={handleImageDragEnd}
                        onDrop={(e) => handleImageDrop(e, index)}
                        className={`pf-variant-thumb${isMain ? ' is-main' : ''}${isDragging ? ' is-dragging' : ''}${isDragOver ? ' is-drag-over' : ''}`}
                        title="Drag to change sequence order"
                      >
                        {/* Sequence number badge */}
                        <span className="pf-variant-thumb__seq">
                          #{index + 1}
                        </span>

                        <img src={image.url} alt={`Product image ${index + 1}`} draggable={false} />

                        {/* Top action buttons */}
                        <div className="pf-variant-thumb__actions">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVariantMainImage(image.id || image.url);
                            }}
                            className={`pf-variant-thumb__star${isMain ? ' is-active' : ''}`}
                            title={isMain ? "Primary Image (Thumbnail)" : "Set as Primary Image"}
                            aria-label={isMain ? "Primary Image" : "Set as Primary Image"}
                          >
                            ★
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeVariantImage(image.id || image.url);
                            }}
                            className="pf-variant-thumb__remove"
                            title="Remove image"
                            aria-label="Remove image"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Primary Banner / Make Primary Button */}
                        {isMain ? (
                          <div className="pf-variant-thumb__primary-tag">
                            ★ PRIMARY
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVariantMainImage(image.id || image.url);
                            }}
                            className="pf-variant-thumb__set-primary"
                          >
                            Make Primary
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Drag thumbnails to arrange display sequence
                  </span>
                  <span>★ = Primary Thumbnail</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Wholesale Pricing */}
          <div className="pf-variant-section">
              <div className="pf-variant-row">
                <div>
                  <label className="pf-variant-label">Wholesale Bulk Pricing</label>
                  <p className="pf-variant-hint">Enable special rates for B2B / wholesale orders</p>
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

            {/* Catalog Fields Override */}
            <VariantCatalogFieldsSection
              title={variantForm.title ?? ''}
              description={variantForm.description ?? ''}
              placeholderTitle={formData?.title || formData?.name || ''}
              placeholderDescription={formData?.description || ''}
              onTitleChange={(value) => setVariantForm((prev) => ({ ...prev, title: value }))}
              onDescriptionChange={(value) => setVariantForm((prev) => ({ ...prev, description: value }))}
            />
      </div>

      <div className="pf-variant-card__footer">
        {saveError ? (
          <div className="pf-variant-error" role="alert">{saveError}</div>
        ) : null}
        <div className="pf-variant-card__actions">
          <button type="button" onClick={onClose} disabled={isSaving} className="pf-variant-btn pf-variant-btn--cancel">Cancel</button>
          <button type="button" onClick={handleSave} disabled={isSaving} className="pf-variant-btn pf-variant-btn--save">
            {isSaving ? 'Saving...' : (isEditing ? 'Update Variant' : 'Save Variant')}
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

