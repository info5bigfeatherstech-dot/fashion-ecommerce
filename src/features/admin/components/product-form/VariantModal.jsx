// Shared_components/VariantModal.jsx

import { useState } from 'react'
import VariantCatalogFieldsSection from './VariantCatalogFieldsSection'
import { emptyVariantShippingForm } from '@/lib/variantCatalogForm'

export const defaultVariant = {
  attributes: [{ key: '', value: '' }],
  price: { base: '', sale: '', wholesaleBase: '', wholesaleSale: '' },
  inventory: { quantity: 0, lowStockThreshold: 5, trackInventory: true },
  images: [],
  isActive: true,
  ProductCode: '',
  wholesale: false,
  minimumOrderQuantity: 1,
  channelVisibility: { ecomm: 'active', wholesale: 'draft' },
  title: '',
  description: '',
  shipping: emptyVariantShippingForm(),
};

const VariantModal = ({
  variantForm,
  setVariantForm,
  editingVariantIndex,
  onSave,
  onClose,
  getDiscountPercentage,
  isSaving = false,
  saveError = null,
}) => {
  const [variantImageDragging, setVariantImageDragging] = useState(false);
  const isEditing = editingVariantIndex !== null;

  const addVariantAttribute = () =>
    setVariantForm(prev => ({ ...prev, attributes: [...prev.attributes, { key: '', value: '' }] }));

  const removeVariantAttribute = (index) =>
    setVariantForm(prev => ({ ...prev, attributes: prev.attributes.filter((_, i) => i !== index) }));

  const updateVariantAttribute = (index, field, value) =>
    setVariantForm(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => i === index ? { ...attr, [field]: value } : attr)
    }));

  const handleVariantImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...variantForm.images];
    files.forEach((file, index) => {
      if (newImages.length < 4) {
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
      alert('ProductCode is required');
      return;
    }
    {
      const m = ProductCode.toUpperCase().match(/^([A-Z0-9]+)-(\d+)$/);
      const seq = m ? Number(m[2]) : NaN;
      if (!m || !Number.isInteger(seq) || seq < 1) {
        alert("ProductCode must be BASE-N (e.g., 3897-1 or 3897-01)");
        return;
      }
    }
    if (!variantForm.price.base) {
      alert('Please enter base price for this variant');
      return;
    }

    const base = parseFloat(variantForm.price.base) || 0;
    const sale = (variantForm.price.sale !== '' && variantForm.price.sale != null && variantForm.price.sale !== 'null')
      ? parseFloat(variantForm.price.sale)
      : null;

    if (base <= 0) {
      alert('Base price must be greater than 0');
      return;
    }
    if (sale !== null && sale >= base) {
      alert('Sale price must be less than base price');
      return;
    }

    if (variantForm.wholesale) {
      const wholesaleBase = parseFloat(variantForm.price.wholesaleBase) || 0;
      if (wholesaleBase <= 0) {
        alert('Wholesale base price is required and must be greater than 0');
        return;
      }
      if (!variantForm.minimumOrderQuantity || parseInt(variantForm.minimumOrderQuantity) < 1) {
        alert('Minimum Order Quantity (MOQ) must be at least 1');
        return;
      }
      const wholesaleSale = (variantForm.price.wholesaleSale !== '' && variantForm.price.wholesaleSale != null)
        ? parseFloat(variantForm.price.wholesaleSale)
        : null;
      if (wholesaleSale !== null && wholesaleSale >= wholesaleBase) {
        alert('Wholesale sale price must be less than wholesale base price');
        return;
      }
    }

    const validAttributes = variantForm.attributes.filter(a => a.key.trim() && a.value.trim());

    // CRITICAL: Pass price object with wholesaleBase INSIDE, NOT at root level
    onSave({
      ...variantForm,
      ProductCode: ProductCode,
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

  return (
    <div className="pf-variant-overlay">
      <div className="pf-variant-card">
        <div className="pf-variant-card__head">
          <div>
            <h3>{isEditing ? 'Edit Variant' : 'Add New Variant'}</h3>
            <p>{isEditing ? 'Update price, inventory & attributes' : 'Set ProductCode, attributes, price & stock'}</p>
          </div>
          <button type="button" onClick={onClose} className="pf-variant-close" aria-label="Close">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="pf-variant-card__body">
          <div className="pf-variant-section">
            <label className="pf-variant-label">
              Variant Product Code <span className="pf-req">*</span>
              {isEditing ? <span className="pf-variant-locked">🔒 Locked</span> : null}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={variantForm.ProductCode ?? ''}
              onChange={(e) => setVariantForm((prev) => ({ ...prev, ProductCode: e.target.value }))}
              disabled={isEditing}
              className={`pf-variant-input pf-variant-input--mono${isEditing ? ' is-locked' : ''}`}
              placeholder="e.g., 1234567890128"
            />
          </div>

          <div className="pf-variant-section">
            <div className="pf-variant-row">
              <label className="pf-variant-label">
                Attributes <span className="pf-variant-optional">(optional)</span>
              </label>
              <button type="button" onClick={addVariantAttribute} className="pf-variant-chip">+ Add</button>
            </div>
            <div className="pf-variant-attr-list">
              {variantForm.attributes.map((attr, index) => (
                <div key={index} className="pf-variant-attr-row">
                  <input type="text" value={attr.key} onChange={(e) => updateVariantAttribute(index, 'key', e.target.value)} className="pf-variant-input" placeholder="Key (e.g., Color)" />
                  <input type="text" value={attr.value} onChange={(e) => updateVariantAttribute(index, 'value', e.target.value)} className="pf-variant-input" placeholder="Value (e.g., Blue)" />
                  {variantForm.attributes.length > 1 ? (
                    <button type="button" onClick={() => removeVariantAttribute(index)} className="pf-variant-remove" aria-label="Remove attribute">✕</button>
                  ) : null}
                </div>
              ))}
            </div>
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
            <label className="pf-variant-label">Pricing (₹)</label>
            <div className="pf-variant-grid">
              <div className="pf-variant-field">
                <label>Base Price <span className="pf-req">*</span></label>
                <input type="number" value={variantForm.price.base} onChange={(e) => setVariantForm((prev) => ({ ...prev, price: { ...prev.price, base: e.target.value } }))} className="pf-variant-input" placeholder="89000" />
              </div>
              <div className="pf-variant-field">
                <label>Sale Price</label>
                <input type="number" value={variantForm.price.sale ?? ''} onChange={(e) => setVariantForm((prev) => ({ ...prev, price: { ...prev.price, sale: e.target.value } }))} className="pf-variant-input" placeholder="79000" />
              </div>
            </div>
          </div>

          <div className="pf-variant-section pf-variant-section--divided">
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
                    <input type="number" value={variantForm.price.wholesaleBase || ''} onChange={(e) => setVariantForm((prev) => ({ ...prev, price: { ...prev.price, wholesaleBase: e.target.value } }))} className="pf-variant-input" placeholder="75000" />
                  </div>
                  <div className="pf-variant-field">
                    <label>Wholesale Sale Price (₹)</label>
                    <input type="number" value={variantForm.price.wholesaleSale || ''} onChange={(e) => setVariantForm((prev) => ({ ...prev, price: { ...prev.price, wholesaleSale: e.target.value } }))} className="pf-variant-input" placeholder="72000" />
                  </div>
                </div>
                <div className="pf-variant-field">
                  <label>Minimum Order Quantity (MOQ)</label>
                  <input type="number" min="1" value={variantForm.minimumOrderQuantity || 1} onChange={(e) => setVariantForm((prev) => ({ ...prev, minimumOrderQuantity: parseInt(e.target.value, 10) || 1 }))} className="pf-variant-input" />
                </div>
                {isWholesaleMoqUnmet() ? (
                  <p className="pf-main__warn">
                    Wholesale warning: MOQ ({variantForm.minimumOrderQuantity ?? 1}) is greater than stock ({variantForm.inventory?.quantity ?? 0})
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <VariantCatalogFieldsSection
            title={variantForm.title ?? ''}
            description={variantForm.description ?? ''}
            shipping={variantForm.shipping ?? emptyVariantShippingForm()}
            onTitleChange={(value) => setVariantForm((prev) => ({ ...prev, title: value }))}
            onDescriptionChange={(value) => setVariantForm((prev) => ({ ...prev, description: value }))}
            onShippingChange={(shipping) => setVariantForm((prev) => ({ ...prev, shipping }))}
          />

          <div className="pf-variant-section">
            <div className="pf-variant-row">
              <label className="pf-variant-label">Inventory</label>
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
              <div className="pf-variant-grid">
                <input type="number" value={variantForm.inventory.quantity} onChange={(e) => setVariantForm((prev) => ({ ...prev, inventory: { ...prev.inventory, quantity: parseInt(e.target.value, 10) || 0 } }))} className="pf-variant-input" placeholder="Quantity" />
                <input type="number" value={variantForm.inventory.lowStockThreshold} onChange={(e) => setVariantForm((prev) => ({ ...prev, inventory: { ...prev.inventory, lowStockThreshold: parseInt(e.target.value, 10) || 5 } }))} className="pf-variant-input" placeholder="Low stock alert" />
              </div>
            ) : null}
          </div>

          <div className="pf-variant-section">
            <label className="pf-variant-label">Images (up to 4)</label>
            <label
              className={`pf-variant-dropzone${variantImageDragging ? ' is-drag' : ''}${variantForm.images.length >= 4 ? ' is-full' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setVariantImageDragging(true) }}
              onDragLeave={() => setVariantImageDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setVariantImageDragging(false)
                handleVariantImageUpload({ target: { files: e.dataTransfer.files } })
              }}
            >
              <input type="file" multiple accept="image/*" onChange={handleVariantImageUpload} className="pf-variant-file" disabled={variantForm.images.length >= 4} />
              <p>Click or drop images ({variantForm.images.length}/4)</p>
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
    </div>
  )
}

export default VariantModal

