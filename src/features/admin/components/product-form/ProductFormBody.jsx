import { useState } from 'react'
import { ADMIN_PRODUCT_MARKETING_TAGS } from '@/features/admin/constants/productMarketingTags'
import { parseQuantityInput, quantityFieldValue } from './utils'

const MARKETING_TOGGLE_CLASS = {
  'today-arrival': 'pf-toggle--today',
  'jewellery-spotted': 'pf-toggle--spotted',
  'bestselling-jewelry': 'pf-toggle--bestselling',
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
  onOpenAttributeModal,
  onEditAttribute,
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
}) {
  const isEditMode = !!productSlug;
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [isDraggingZone, setIsDraggingZone] = useState(false);

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
      if (current.length >= 5) return;
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
  const extraVariants = isEditMode ? (formData.variants?.slice(1) ?? []) : (formData.variants ?? []);
  const extraOffset = isEditMode ? 1 : 0;
  const displayedAttributes = isEditMode ? (primaryVariant?.attributes || []) : (formData.attributes || []);

  const primaryBase = formData.price?.base ?? "";
  const primarySale = formData.price?.sale ?? "";
  const primaryTrack = formData.inventory?.trackInventory ?? true;
  const primaryQty = formData.inventory?.quantity;
  const primaryLow = formData.inventory?.lowStockThreshold ?? 5;

  const mainGalleryImage = galleryImages.find((img) => img.isMain) || galleryImages[0] || null;

  // Helper to determine if variant is wholesale eligible (for read-only badge)
  const isWholesaleEligible = (variant) => {
    return variant?.wholesale === true && (variant?.price?.wholesaleBase > 0);
  };

  const isWholesaleMoqUnmet = (variant) => {
    if (!variant?.wholesale) return false;
    const quantity = Number(variant?.inventory?.quantity ?? 0);
    const moq = Number(variant?.minimumOrderQuantity ?? 1);
    return moq > quantity;
  };

  // Get wholesale visibility badge text
  const getWholesaleVisibilityBadge = (variant) => {
    const isEligible = isWholesaleEligible(variant);
    if (!isEligible) return { text: "Ineligible", color: "bg-gray-100 text-gray-500" };
    const isActive = variant?.channelVisibility?.wholesale === "active";
    return isActive
      ? { text: "Active", color: "bg-purple-100 text-purple-700" }
      : { text: "Draft", color: "bg-gray-100 text-gray-500" };
  };

  // Get ecomm visibility badge text (for read-only display)
  const getEcommVisibilityBadge = (variant) => {
    const isActive = variant?.channelVisibility?.ecomm === "active";
    return isActive
      ? { text: "Active", color: "bg-green-100 text-green-700" }
      : { text: "Draft", color: "bg-gray-100 text-gray-500" };
  };


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
                Homepage sections (storefront wiring uses these tags later)
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
                    <input type="number" value={primaryVariant.inventory?.lowStockThreshold ?? 5} onChange={(e) => updateMainVariantInventory('lowStockThreshold', parseInt(e.target.value, 10) || 5)} className="pf-input" placeholder="Low stock alert" />
                  </div>
                )}
              </div>
            </div>

            <div className="pf-main__tip">
              <span aria-hidden="true">💡</span>
              <p>
                Images for main variant are managed in the <strong>Product Gallery</strong> panel →. All changes here are saved when you click <strong>Save Changes</strong>.
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Code <span className="text-red-400">*</span></label>
                <input type="text" value={formData.ProductCode || ""} onChange={(e) => setFormData((p) => ({ ...p, ProductCode: e.target.value }))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono" placeholder="e.g., 1234567890128" maxLength={20} />
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
                      <input type="number" value={primaryLow} onChange={(e) => setFormData((p) => ({ ...p, inventory: { ...p.inventory, lowStockThreshold: parseInt(e.target.value) || 5 } }))} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="5" />
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

        {/* Product Attributes - unchanged */}
        <div className="pf-card">
          <div className="pf-card__head pf-card__head--row">
            <h3>Product Attributes</h3>
            <button type="button" onClick={onOpenAttributeModal} className="pf-chip-btn">+ Add</button>
          </div>
          <div className="pf-card__body">
          {!displayedAttributes.length ? (
              <p className="pf-empty">No attributes added yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {displayedAttributes.map((attr) => (
                  <div key={attr.id} className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg group hover:bg-gray-100 transition-colors">
                    <span className="text-sm whitespace-nowrap"><span className="font-medium text-gray-700">{attr.key}:</span> <span className="text-gray-600">{attr.value}</span></span>
                    <button type="button" onClick={() => onEditAttribute(attr)} className="text-gray-400 hover:text-blue-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button type="button" onClick={() => onRemoveAttribute(attr.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Additional Variants - UPDATED with channel visibility badges */}
        <div className="pf-card">
          <div className="pf-card__head pf-card__head--row">
            <div>
              <h3>{isEditMode ? 'Additional Variants' : 'Product Variants'}</h3>
              <p>{isEditMode ? 'variants[1+] · each has its own ProductCode, price, images' : 'e.g., different colors or sizes — each needs a unique ProductCode'}</p>
            </div>
            <button type="button" onClick={onOpenAddVariant} disabled={actionLoading && isEditMode} className="pf-chip-btn pf-chip-btn--indigo">
              + Add Variant
            </button>
          </div>
          <div className="pf-card__body">
            {actionError && isEditMode && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-700 text-sm">❌😢 {actionError}</p></div>
            )}
            {extraVariants.length === 0 ? (
              <div className="pf-empty-box">
                <p>{isEditMode ? 'No additional variants — main variant is the card above' : 'No variants yet'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {extraVariants.map((variant, idx) => {
                  const realIndex = extraOffset + idx;
                  const variantThumb = variant.images?.find((img) => img.isMain)?.url || variant.images?.[0]?.url || null;
                  const ecommBadge = getEcommVisibilityBadge(variant);
                  const wholesaleBadge = getWholesaleVisibilityBadge(variant);
                  const isEligibleForWholesale = isWholesaleEligible(variant);

                  return (
                    <div key={variant._id || variant.productCode || `v-${realIndex}`} className={`rounded-lg border-2 p-3 transition-all ${ecommBadge.text === "Active" ? "border-indigo-200 bg-indigo-50" : "border-gray-200 bg-gray-50 opacity-60"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {variantThumb ? (
                            <img src={variantThumb} alt="" className="w-10 h-10 rounded-lg object-cover border border-indigo-200 flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {variant.attributes?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-1.5">
                                {variant.attributes.map((attr, aIdx) => (
                                  <span key={aIdx} className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{attr.key}: {attr.value}</span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm">
                              <span className="font-semibold text-gray-900">{formatIndianRupee(variant.price?.sale || variant.price?.base)}</span>
                              {variant.price?.sale != null && Number(variant.price.sale) > 0 && Number(variant.price.sale) < Number(variant.price.base) && (
                                <>
                                  <span className="text-gray-400 line-through text-xs">{formatIndianRupee(variant.price.base)}</span>
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{getDiscountPercentage(variant.price.base, variant.price.sale)}% OFF</span>
                                </>
                              )}
                              <span className="text-gray-400 text-xs">·</span>
                              <span className="text-gray-600 text-xs">Qty: {variant.inventory?.quantity ?? 0}</span>
                              {variant.productCode != null && (
                                <>
                                  <span className="text-gray-400 text-xs">·</span>
                                  <span className="text-xs font-mono text-gray-700 bg-white border border-gray-300 px-1.5 py-0.5 rounded">📦 {variant.productCode}</span>
                                </>
                              )}
                              {/* Ecom visibility badge */}
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ecommBadge.color}`}>Ecom: {ecommBadge.text}</span>
                              {/* Wholesale visibility badge - conditional on eligibility */}
                              {isEligibleForWholesale && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${wholesaleBadge.color}`}>Wholesale: {wholesaleBadge.text}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => onToggleVariantActive(realIndex)}
                            disabled={actionLoading && isEditMode}
                            title={ecommBadge.text === 'Active' ? 'Click to deactivate (ecom)' : 'Click to activate (ecom)'}
                            aria-label="Toggle ecom visibility"
                            className={`pf-toggle pf-toggle--ecom${ecommBadge.text === 'Active' ? ' is-on' : ''}${(actionLoading && isEditMode) ? ' is-disabled' : ''}`}
                          >
                            <span className="pf-toggle__knob" />
                          </button>
                          <button type="button" onClick={() => onOpenEditVariant(realIndex)} disabled={actionLoading && isEditMode} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg disabled:opacity-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button type="button" onClick={() => onDeleteVariant(realIndex)} disabled={actionLoading && isEditMode} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <aside className="pf-layout__aside">
        <div className="pf-card pf-gallery">
          <div className="pf-card__head">
            <h3>Product Gallery</h3>
            <p>{isEditMode ? 'Main variant images · ★ = thumbnail · saved with Save Changes' : 'Up to 5 · drag to reorder · ★ = thumbnail'}</p>
          </div>
          {mainGalleryImage && (
            <div className="pf-gallery__hero">
              <img src={mainGalleryImage.url} alt="Main" />
              <span>★ MAIN</span>
            </div>
          )}
          <div className="pf-card__body">
            <label
              className={`pf-dropzone${isDraggingZone ? ' is-drag' : ''}${galleryImages.length >= 5 ? ' is-full' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingZone(true); }}
              onDragLeave={() => setIsDraggingZone(false)}
              onDrop={(e) => { e.preventDefault(); setIsDraggingZone(false); handleGalleryUpload({ target: { files: e.dataTransfer.files } }); }}
            >
              <input type="file" multiple accept="image/*" className="hidden" disabled={galleryImages.length >= 5} onChange={handleGalleryUpload} />
              <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p>{galleryImages.length}/5 · click or drop</p>
            </label>
            {galleryImages.length > 0 && (
              <div className="mt-3 space-y-2">
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
                <p className="text-xs text-gray-400 text-center">Drag to reorder · ★ = thumbnail</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}

