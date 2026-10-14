import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { Trash2, X } from 'lucide-react'
import { ADMIN_PRODUCT_MARKETING_TAGS } from '@/features/admin/constants/productMarketingTags'
import { useAdminProductCodePrefixSettings } from '@/features/admin/hooks'
import VariantModal from './VariantModal'
import { parseQuantityInput, quantityFieldValue, MAX_VARIANT_IMAGES, nextVariantProductCode } from './utils'
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

const TAX_RATE_OPTIONS = [
  { value: 0, label: "0% (Nil Rated)" },
  { value: 5, label: "5% (GST)" },
  { value: 12, label: "12% (GST)" },
  { value: 18, label: "18% (GST)" },
  { value: 28, label: "28% (GST)" },
];

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
}) {
  const isEditMode = !!productSlug;
  const { data: prefixSettings } = useAdminProductCodePrefixSettings({ enabled: !isEditMode })
  const listingPrefix = prefixSettings?.configured ? String(prefixSettings.prefix || '').toUpperCase() : ''
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [isDraggingZone, setIsDraggingZone] = useState(false);
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

  useEffect(() => {
    if (showVariantForm && variantDropdownRef.current) {
      variantDropdownRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showVariantForm, editingVariantIndex]);

  const galleryImages = isEditMode ? (formData.variants?.[0]?.images || []) : (formData.images || []);

  const setGalleryImages = (updater) => {
    if (isEditMode) {
      setFormData((p) => {
        const v = [...(p.variants || [])];
        if (!v[0]) return p;
        const next = typeof updater === "function" ? updater(v[0].images || []) : updater;
        v[0] = { ...v[0], images: next };
        return { ...p, variants: v };
      });
    } else {
      setFormData((p) => {
        const next = typeof updater === "function" ? updater(p.images || []) : updater;
        return { ...p, images: next };
      });
    }
  };

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files);
    const current = [...galleryImages];
    files.forEach((file, i) => {
      if (current.length >= MAX_VARIANT_IMAGES) return;
      const id = `gimg-${Date.now()}-${i}`;
      const reader = new FileReader();
      reader.onloadend = () => {
        current.push({ id, url: reader.result, file, name: file.name, isMain: current.length === 0 });
        setGalleryImages([...current]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (id) =>
    setGalleryImages((imgs) => {
      const wasMain = imgs.find((img) => img.id === id || img.url === id)?.isMain;
      const next = imgs.filter((img) => img.id !== id && img.url !== id);
      if (wasMain && next.length > 0) next[0] = { ...next[0], isMain: true };
      return next;
    });

  const setMainGalleryImage = (id) =>
    setGalleryImages((imgs) => imgs.map((img) => ({ ...img, isMain: img.id === id || img.url === id })));

  const handleGalleryDragStart = (e, index) => setDraggedIdx(index);
  const handleGalleryDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const imgs = [...galleryImages];
    const [moved] = imgs.splice(draggedIdx, 1);
    imgs.splice(index, 0, moved);
    imgs.forEach((img, i) => { img.isMain = i === 0; });
    setGalleryImages(imgs);
    setDraggedIdx(index);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("shipping.dimensions.")) {
      const dim = name.split(".")[2];
      setFormData((p) => ({ ...p, shipping: { ...p.shipping, dimensions: { ...p.shipping.dimensions, [dim]: value } } }));
    } else if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((p) => ({ ...p, [parent]: { ...p[parent], [child]: type === "checkbox" ? checked : value } }));
    } else {
      setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const updateMainVariantField = (field, value) => {
    setFormData((p) => {
      const v = [...(p.variants || [])];
      if (!v[0]) return p;
      v[0] = { ...v[0], [field]: value };
      return { ...p, variants: v };
    });
  };

  const updateMainVariantPrice = (field, value) => {
    setFormData((p) => {
      const v = [...(p.variants || [])];
      if (!v[0]) return p;
      v[0] = { ...v[0], price: { ...v[0].price, [field]: value } };
      return { ...p, variants: v };
    });
  };

  const updateMainVariantInventory = (field, value) => {
    setFormData((p) => {
      const v = [...(p.variants || [])];
      if (!v[0]) return p;
      v[0] = { ...v[0], inventory: { ...v[0].inventory, [field]: value } };
      return { ...p, variants: v };
    });
  };

  const updateMainVariantChannelVisibility = (field, value) => {
    setFormData((p) => {
      const v = [...(p.variants || [])];
      if (!v[0]) return p;
      const currentVisibility = v[0].channelVisibility || { ecomm: "active", wholesale: "draft" };
      const nextVariant = {
        ...v[0],
        channelVisibility: { ...currentVisibility, [field]: value },
      };
      if (field === "ecomm") {
        nextVariant.isActive = value === "active";
      }
      v[0] = nextVariant;
      return { ...p, variants: v };
    });
  };

  const primaryVariant = isEditMode ? (formData.variants?.[0] ?? null) : null;
  const displayedAttributes = isEditMode ? (primaryVariant?.attributes || []) : (formData.attributes || []);

  const primaryBase = formData.price?.base ?? "";
  const primarySale = formData.price?.sale ?? "";
  const primaryTrack = formData.inventory?.trackInventory ?? true;
  const primaryQty = formData.inventory?.quantity;
  const primaryLow = formData.inventory?.lowStockThreshold ?? 0;

  const mainGalleryImage = galleryImages.find((img) => img.isMain) || galleryImages[0] || null;


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
          list.push({
            isPrimary,
            realIndex: i,
            displayIndex: i + 1,
            code: v.ProductCode || v.productCode || (isPrimary ? (formData.ProductCode || formData.productCode) : ''),
            attributes: isPrimary
              ? (displayedAttributes.length > 0 ? displayedAttributes : (v.attributes || []))
              : (v.attributes || []),
            price: v.price?.sale || v.price?.base || (isPrimary ? (primarySale || primaryBase) : 0),
            stock: v.inventory?.quantity ?? (isPrimary ? (primaryQty ?? 0) : 0),
            isActive: v.channelVisibility?.ecomm === 'active' || (v.isActive !== false && v.channelVisibility?.ecomm !== 'draft'),
            raw: v,
          })
        })
      }
    } else {
      list.push({
        isPrimary: true,
        realIndex: 'primary',
        displayIndex: 1,
        code: formData.ProductCode || formData.productCode || '',
        attributes: formData.attributes || [],
        price: formData.price?.sale || formData.price?.base || 0,
        stock: formData.inventory?.quantity ?? 0,
        isActive: formData.status !== 'inactive',
      })
      ;(formData.variants || []).forEach((v, i) => {
        list.push({
          isPrimary: false,
          realIndex: i,
          displayIndex: i + 2,
          code: v.ProductCode || v.productCode || '',
          attributes: v.attributes || [],
          price: v.price?.sale || v.price?.base || 0,
          stock: v.inventory?.quantity ?? 0,
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

        {isEditMode && primaryVariant && (
          <div className="pf-main">
            <div className="pf-main__head">
              <h3>Main Variant</h3>
              <p>
                <span className="pf-main__code-icon" aria-hidden="true">📦</span>
                ProductCode: {primaryVariant.productCode}
              </p>
            </div>

            <div className="pf-main__body">
              <div className="pf-main__panel pf-main__panel--ecom">
                <div>
                  <label>Ecom Visibility</label>
                  <p>Show on ecommerce storefront</p>
                </div>
                <button
                  type="button"
                  aria-label="Toggle ecom visibility"
                  onClick={() => {
                    const newValue = primaryVariant.channelVisibility?.ecomm === 'active' ? 'draft' : 'active'
                    updateMainVariantChannelVisibility('ecomm', newValue)
                  }}
                  className={`pf-toggle pf-toggle--ecom${primaryVariant.channelVisibility?.ecomm === 'active' ? ' is-on' : ''}`}
                >
                  <span className="pf-toggle__knob" />
                </button>
              </div>

              <div className={`pf-main__panel${(primaryVariant.wholesale && primaryVariant.price?.wholesaleBase > 0) ? ' pf-main__panel--wholesale-on' : ' pf-main__panel--muted'}`}>
                <div>
                  <label>Wholesale Visibility</label>
                  <p>Auto-calculated from wholesale price</p>
                </div>
                <span className={`pf-main__badge${(primaryVariant.wholesale && primaryVariant.price?.wholesaleBase > 0) ? ' is-active' : ''}`}>
                  {(primaryVariant.wholesale && primaryVariant.price?.wholesaleBase > 0) ? 'Active' : 'Ineligible'}
                </span>
              </div>

              <div className="pf-main__section">
                <label className="pf-main__section-title">Price (₹)</label>
                <div className="pf-row">
                  <div className="pf-field">
                    <label className="pf-main__sublabel">Base Price</label>
                    <input type="number" value={primaryVariant.price?.base ?? ''} onChange={(e) => updateMainVariantPrice('base', e.target.value)} className="pf-input" />
                  </div>
                  <div className="pf-field">
                    <label className="pf-main__sublabel">Sale Price</label>
                    <input type="number" value={primaryVariant.price?.sale ?? ''} onChange={(e) => updateMainVariantPrice('sale', e.target.value)} className="pf-input" />
                  </div>
                </div>
              </div>

              <div className="pf-main__divider">
                <div className="pf-main__row">
                  <label>Wholesale Pricing</label>
                  <button
                    type="button"
                    aria-label="Toggle wholesale pricing"
                    onClick={() => updateMainVariantField('wholesale', !primaryVariant.wholesale)}
                    className={`pf-toggle pf-toggle--wholesale${primaryVariant.wholesale ? ' is-on' : ''}`}
                  >
                    <span className="pf-toggle__knob" />
                  </button>
                </div>
                {primaryVariant.wholesale && (
                  <div className="pf-main__wholesale-box">
                    <div className="pf-row">
                      <div className="pf-field">
                        <label className="pf-main__sublabel">Wholesale Base Price (₹)</label>
                        <input type="number" value={primaryVariant.price?.wholesaleBase ?? ''} onChange={(e) => updateMainVariantPrice('wholesaleBase', e.target.value)} className="pf-input" />
                      </div>
                      <div className="pf-field">
                        <label className="pf-main__sublabel">Wholesale Sale Price (₹)</label>
                        <input type="number" value={primaryVariant.price?.wholesaleSale ?? ''} onChange={(e) => updateMainVariantPrice('wholesaleSale', e.target.value)} className="pf-input" />
                      </div>
                    </div>
                    <div className="pf-field">
                      <label className="pf-main__sublabel">Minimum Order Quantity (MOQ)</label>
                      <input type="number" min="1" value={primaryVariant.minimumOrderQuantity ?? 1} onChange={(e) => updateMainVariantField('minimumOrderQuantity', parseInt(e.target.value, 10) || 1)} className="pf-input" />
                    </div>
                    {isWholesaleMoqUnmet(primaryVariant) && (
                      <p className="pf-main__warn">
                        Wholesale warning: MOQ ({primaryVariant.minimumOrderQuantity ?? 1}) is greater than stock ({primaryVariant.inventory?.quantity ?? 0})
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pf-main__section">
                <div className="pf-main__row">
                  <label>Inventory</label>
                  <button
                    type="button"
                    aria-label="Toggle inventory tracking"
                    onClick={() => updateMainVariantInventory('trackInventory', !primaryVariant.inventory?.trackInventory)}
                    className={`pf-toggle pf-toggle--inventory${primaryVariant.inventory?.trackInventory !== false ? ' is-on' : ''}`}
                  >
                    <span className="pf-toggle__knob" />
                  </button>
                </div>
                {primaryVariant.inventory?.trackInventory !== false && (
                  <div className="pf-row">
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={quantityFieldValue(primaryVariant.inventory?.quantity)}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateMainVariantInventory('quantity', parseQuantityInput(e.target.value))}
                      className="pf-input"
                      placeholder="Quantity"
                    />
                    <input type="number" min={0} value={primaryVariant.inventory?.lowStockThreshold ?? 0} onChange={(e) => {
                      const n = parseInt(e.target.value, 10)
                      updateMainVariantInventory('lowStockThreshold', Number.isFinite(n) && n >= 0 ? n : 0)
                    }} className="pf-input" placeholder="Low stock alert" />
                  </div>
                )}
              </div>
            </div>

            <div className="pf-main__tip">
              <span aria-hidden="true">💡</span>
              <p>
                Images for main variant are managed in the <strong>Product Gallery</strong> section below. All changes here are saved when you click <strong>Save Changes</strong>.
              </p>
            </div>
          </div>
        )}

        {/* CREATE MODE: ProductCode + price + inventory */}
        {!isEditMode && (
          <div className="pf-card">
            <div className="pf-card__head">
              <h3>Product Details</h3>
              <p>These become variants[0] on submit</p>
            </div>
            <div className="pf-card__body">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Code <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      const newCode = `${rand}-1`;
                      setFormData((p) => ({ ...p, ProductCode: newCode }));
                      if (showVariantForm && editingVariantIndex === null && setVariantForm) {
                        const nextCode = nextVariantProductCode({ ...formData, ProductCode: newCode });
                        if (nextCode) {
                          setVariantForm((prev) => ({ ...prev, ProductCode: nextCode }));
                        }
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                    title="Generate a unique product code"
                  >
                    <span>⚡ Auto-generate</span>
                  </button>
                </div>
                <div className="flex items-stretch gap-0">
                  {listingPrefix ? (
                    <span
                      className="inline-flex items-center px-3 py-2 bg-gray-100 border border-r-0 border-gray-200 rounded-l-lg font-mono text-sm text-gray-700 select-none"
                      title="Configured listing prefix"
                    >
                      {listingPrefix}
                    </span>
                  ) : null}
                  <input
                    type="text"
                    value={formData.ProductCode || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((p) => ({ ...p, ProductCode: val }));
                      if (showVariantForm && editingVariantIndex === null && setVariantForm) {
                        const nextCode = nextVariantProductCode({ ...formData, ProductCode: val });
                        if (nextCode) {
                          setVariantForm((prev) => ({ ...prev, ProductCode: nextCode }));
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val && !/-\d+$/.test(val)) {
                        const formatted = `${val.toUpperCase()}-1`;
                        setFormData((p) => ({ ...p, ProductCode: formatted }));
                        if (showVariantForm && editingVariantIndex === null && setVariantForm) {
                          const nextCode = nextVariantProductCode({ ...formData, ProductCode: formatted });
                          if (nextCode) {
                            setVariantForm((prev) => ({ ...prev, ProductCode: nextCode }));
                          }
                        }
                      }
                    }}
                    className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono ${listingPrefix ? 'rounded-r-lg' : 'rounded-lg'}`}
                    placeholder={listingPrefix ? 'e.g. 788 or 788-1' : 'e.g. 788 or 788-1'}
                    maxLength={20}
                  />
                </div>
                {listingPrefix ? (
                  <p className="mt-1.5 text-xs text-gray-500">
                    Saved as <span className="font-mono font-medium text-gray-800">
                      {listingPrefix}
                      {String(formData.ProductCode || '').trim()
                        ? (/-\d+$/.test(String(formData.ProductCode).trim())
                            ? String(formData.ProductCode).trim()
                            : `${String(formData.ProductCode).trim()}-1`)
                        : '…'}
                    </span>.
                    {String(formData.ProductCode || '').trim() && !/-\d+$/.test(String(formData.ProductCode).trim()) ? (
                      <span className="text-blue-600 ml-1">(-1 automatically added for main product)</span>
                    ) : null}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-amber-700">
                    Set a product code prefix in{' '}
                    <Link to="/admin/settings/product-code-prefix" className="underline font-medium">
                      Settings → Product code prefix
                    </Link>{' '}
                    before listing (required). Main variant automatically takes <span className="font-mono font-semibold">-1</span>.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (₹) <span className="text-red-400">*</span></label>
                  <input type="number" value={primaryBase} onChange={(e) => setFormData((p) => ({ ...p, price: { ...p.price, base: e.target.value } }))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="29999" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sale Price (₹)</label>
                  <input type="number" value={primarySale} onChange={(e) => setFormData((p) => ({ ...p, price: { ...p.price, sale: e.target.value } }))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="19999" />
                </div>
              </div>
              {primaryBase && primarySale && (
                <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-3">
                  <span className="text-gray-400 line-through text-sm">{formatIndianRupee(primaryBase)}</span>
                  <span className="text-lg font-bold text-gray-900">{formatIndianRupee(primarySale)}</span>
                  {Number(primarySale) < Number(primaryBase) && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">{getDiscountPercentage(primaryBase, primarySale)}% OFF</span>
                  )}
                </div>
              )}

              {/* Wholesale Toggle for CREATE mode */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Wholesale Pricing</label>
                    <p className="text-xs text-gray-500 mt-0.5">Enable bulk pricing for wholesalers</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Toggle wholesale pricing"
                    onClick={() => setFormData((p) => ({ ...p, wholesale: !p.wholesale }))}
                    className={`pf-toggle pf-toggle--wholesale${formData.wholesale ? ' is-on' : ''}`}
                  >
                    <span className="pf-toggle__knob" />
                  </button>
                </div>
                {formData.wholesale && (
                  <div className="space-y-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Wholesale Base Price (₹) <span className="text-red-400">*</span></label>
                        <input type="number" value={formData.wholesaleBase || ""} onChange={(e) => setFormData((p) => ({ ...p, wholesaleBase: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400" placeholder="e.g., 25000" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Wholesale Sale Price (₹)</label>
                        <input type="number" value={formData.wholesaleSale || ""} onChange={(e) => setFormData((p) => ({ ...p, wholesaleSale: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400" placeholder="e.g., 23000" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Order Quantity (MOQ) <span className="text-red-400">*</span></label>
                      <input type="number" min="1" value={formData.minimumOrderQuantity || 1} onChange={(e) => setFormData((p) => ({ ...p, minimumOrderQuantity: parseInt(e.target.value) || 1 }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400" placeholder="Minimum quantity for wholesale price" />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Track Inventory</span>
                  <button
                    type="button"
                    aria-label="Toggle inventory tracking"
                    onClick={() => setFormData((p) => ({
                      ...p,
                      inventory: { ...p.inventory, trackInventory: !p.inventory.trackInventory },
                    }))}
                    className={`pf-toggle pf-toggle--inventory${primaryTrack ? ' is-on' : ''}`}
                  >
                    <span className="pf-toggle__knob" />
                  </button>
                </div>
                {primaryTrack && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={quantityFieldValue(primaryQty)}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            inventory: {
                              ...p.inventory,
                              quantity: parseQuantityInput(e.target.value),
                            },
                          }))
                        }
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter stock qty"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Low Stock Alert</label>
                      <input type="number" min={0} value={primaryLow} onChange={(e) => {
                        const n = parseInt(e.target.value, 10)
                        setFormData((p) => ({
                          ...p,
                          inventory: {
                            ...p.inventory,
                            lowStockThreshold: Number.isFinite(n) && n >= 0 ? n : 0,
                          },
                        }))
                      }} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0" />
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Shipping — primary variant (variants[0]) uses product-level fields only */}
        <div className="pf-card">
          <div className="pf-card__head">
            <h3>Shipping Details</h3>
            <p>Main variant shipping — also the fallback for extra variants without their own weight/dimensions</p>
          </div>
          <div className="pf-card__body">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">HSN Code </label>
              <input type="text" value={formData.hsnCode || ""} onChange={(e) => setFormData((p) => ({ ...p, hsnCode: e.target.value }))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="e.g., 180987" maxLength={10} />
              <p className="text-xs text-gray-500 mt-1">Harmonized System Nomenclature code for tax purposes</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GST Rate </label>
              <select value={formData.taxRate ?? ""} onChange={(e) => setFormData((p) => ({ ...p, taxRate: e.target.value === "" ? "" : parseFloat(e.target.value) }))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500">
                <option value="">Select GST Rate</option>
                {TAX_RATE_OPTIONS.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Is Fragile? </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="isFragile" value="true" checked={formData.isFragile === true} onChange={() => setFormData((p) => ({ ...p, isFragile: true }))} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Yes (Fragile)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="isFragile" value="false" checked={formData.isFragile === false} onChange={() => setFormData((p) => ({ ...p, isFragile: false }))} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">Indicates if special handling is required during shipping</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
              <input type="number" step="0.1" value={formData.shipping?.weight ?? ""} onChange={(e) => setFormData((p) => ({ ...p, shipping: { ...p.shipping, weight: parseFloat(e.target.value) || 0 } }))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="0.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions (cm)</label>
              <div className="grid grid-cols-3 gap-2">
                {["length", "width", "height"].map((dim) => (
                  <input key={dim} type="number" value={formData.shipping?.dimensions?.[dim] ?? ""} onChange={(e) => setFormData((p) => ({ ...p, shipping: { ...p.shipping, dimensions: { ...p.shipping.dimensions, [dim]: parseFloat(e.target.value) || 0 } } }))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder={dim[0].toUpperCase() + dim.slice(1)} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Gallery (Moved directly after Shipping Details) */}
        <div className="pf-card pf-gallery">
          <div className="pf-card__head">
            <h3>Product Gallery</h3>
            <p>{isEditMode ? 'Main variant images · ★ = thumbnail · saved with Save Changes' : `Up to ${MAX_VARIANT_IMAGES} · drag to reorder · ★ = thumbnail`}</p>
          </div>
          {mainGalleryImage && (
            <div className="pf-gallery__hero">
              <img src={mainGalleryImage.url} alt="Main" />
              <span>★ MAIN</span>
            </div>
          )}
          <div className="pf-card__body">
            <label
              className={`pf-dropzone${isDraggingZone ? ' is-drag' : ''}${galleryImages.length >= MAX_VARIANT_IMAGES ? ' is-full' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingZone(true); }}
              onDragLeave={() => setIsDraggingZone(false)}
              onDrop={(e) => { e.preventDefault(); setIsDraggingZone(false); handleGalleryUpload({ target: { files: e.dataTransfer.files } }); }}
            >
              <input type="file" multiple accept="image/*" className="hidden" disabled={galleryImages.length >= MAX_VARIANT_IMAGES} onChange={handleGalleryUpload} />
              <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p>{galleryImages.length}/{MAX_VARIANT_IMAGES} · click or drop</p>
            </label>
            {galleryImages.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {galleryImages.map((image, index) => (
                  <div key={image.id || image.url} draggable onDragStart={(e) => handleGalleryDragStart(e, index)} onDragOver={(e) => handleGalleryDragOver(e, index)} onDragEnd={() => setDraggedIdx(null)} className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all ${image.isMain ? "border-blue-500 bg-blue-50" : "border-transparent bg-gray-50 hover:border-gray-200"}`}>
                    <div className="w-10 h-10 rounded overflow-hidden bg-white flex-shrink-0 border border-gray-100"><img src={image.url} alt="" className="w-full h-full object-cover" /></div>
                    <div className="flex-1 text-xs truncate text-gray-600">{image.isMain && <span className="text-blue-600 font-bold mr-1">★</span>}{image.name || "Uploaded image"}</div>
                    <div className="flex items-center gap-1">
                      {!image.isMain && (<button type="button" onClick={() => setMainGalleryImage(image.id || image.url)} title="Set as main thumbnail" className="p-1 text-gray-400 hover:text-blue-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                      </button>)}
                      <button type="button" onClick={() => removeGalleryImage(image.id || image.url)} className="p-1 text-gray-400 hover:text-red-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {galleryImages.length > 0 && (
              <p className="text-xs text-gray-400 text-center mt-2">Drag to reorder · ★ = thumbnail</p>
            )}
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
            <button
              type="button"
              onClick={() => {
                if (showVariantForm && editingVariantIndex === null) {
                  onCloseVariantForm?.()
                } else {
                  onOpenAddVariant?.()
                }
              }}
              disabled={actionLoading && isEditMode}
              className={`pf-chip-btn ${showVariantForm && editingVariantIndex === null ? 'pf-chip-btn--secondary' : 'pf-chip-btn--indigo'}`}
            >
              {showVariantForm && editingVariantIndex === null ? '✕ Close Form' : '+ Add Variant'}
            </button>
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
                  variantForm={variantForm}
                  setVariantForm={setVariantForm}
                  editingVariantIndex={editingVariantIndex}
                  onSave={onSaveVariant}
                  onClose={onCloseVariantForm}
                  getDiscountPercentage={getDiscountPercentage}
                  isSaving={variantSaving}
                  saveError={variantSaveError}
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
                              {formatIndianRupee(variant.price)}
                            </span>
                            <span className="text-gray-300 mx-1">|</span>
                            <span>Stock:</span>
                            <span className="font-bold text-gray-900 text-sm">
                              {variant.stock}
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
                            variantForm={variantForm}
                            setVariantForm={setVariantForm}
                            editingVariantIndex={editingVariantIndex}
                            onSave={onSaveVariant}
                            onClose={onCloseVariantForm}
                            getDiscountPercentage={getDiscountPercentage}
                            isSaving={variantSaving}
                            saveError={variantSaveError}
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
                    {formatIndianRupee(variantToDelete.price)}
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

