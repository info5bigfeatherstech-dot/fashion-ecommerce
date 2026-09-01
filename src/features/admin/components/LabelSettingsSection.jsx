import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Printer,
  Save,
  Trash2,
} from 'lucide-react'
import {
  deleteAdminShipmozoLabelLogo,
  getAdminShipmozoLabelSettings,
  previewAdminShipmozoLabelSettings,
  updateAdminShipmozoLabelSettings,
  uploadAdminShipmozoLabelLogo,
} from '@/features/admin/api/settings'

function Toggle({ checked, onChange, label, locked = false }) {
  return (
    <label className={`admin-label-settings__toggle${locked ? ' is-locked' : ''}`}>
      <input
        type="checkbox"
        checked={Boolean(checked)}
        disabled={locked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        {label}
        {locked ? <em>always on</em> : null}
      </span>
    </label>
  )
}

function Section({ title, children }) {
  return (
    <section className="admin-label-settings__section">
      <h3 className="admin-label-settings__section-title">{title}</h3>
      <div className="admin-label-settings__section-grid">{children}</div>
    </section>
  )
}

export default function LabelSettingsSection() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [saveOk, setSaveOk] = useState(false)
  const [storefront, setStorefront] = useState('ecomm')
  const [settings, setSettings] = useState(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewError, setPreviewError] = useState(null)
  const [pickupIdentity, setPickupIdentity] = useState({ name: '', source: '' })
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoRemoving, setLogoRemoving] = useState(false)
  const [logoError, setLogoError] = useState(null)
  const previewTimer = useRef(null)
  const iframeRef = useRef(null)
  const logoInputRef = useRef(null)

  const patch = useCallback((section, key, value) => {
    setSettings((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [section]: {
          ...(prev[section] || {}),
          [key]: value,
        },
      }
    })
    setSaveOk(false)
  }, [])

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const data = await getAdminShipmozoLabelSettings()
      if (!data?.settings) throw new Error('Could not load label settings')
      setStorefront(data.storefront === 'wholesale' ? 'wholesale' : 'ecomm')
      setSettings(data.settings)
      setPickupIdentity({
        name: data.pickupIdentity?.name || '',
        source: data.pickupIdentity?.source || '',
      })
    } catch (e) {
      setFetchError(e?.message || 'Could not load label settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const refreshPreview = useCallback(async (draft) => {
    if (!draft) return
    try {
      const html = await previewAdminShipmozoLabelSettings(draft)
      setPreviewHtml(html)
      setPreviewError(null)
    } catch (e) {
      setPreviewError(e?.message || 'Preview failed')
    }
  }, [])

  useEffect(() => {
    if (!settings) return
    if (previewTimer.current) clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(() => {
      refreshPreview(settings)
    }, 350)
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current)
    }
  }, [settings, refreshPreview])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setSaveError(null)
    setSaveOk(false)
    try {
      const data = await updateAdminShipmozoLabelSettings(settings)
      setSaveOk(true)
      if (data?.settings) setSettings(data.settings)
      if (data?.pickupIdentity) {
        setPickupIdentity({
          name: data.pickupIdentity.name || '',
          source: data.pickupIdentity.source || '',
        })
      }
    } catch (e) {
      setSaveError(e?.message || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    const frame = iframeRef.current
    if (!frame?.contentWindow) return
    try {
      frame.contentWindow.focus()
      frame.contentWindow.print()
    } catch {
      /* ignore */
    }
  }

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    setLogoError(null)
    setSaveOk(false)
    try {
      const data = await uploadAdminShipmozoLabelLogo(file)
      if (!data?.settings) throw new Error('Logo upload failed')
      setSettings(data.settings)
      if (data?.pickupIdentity) {
        setPickupIdentity({
          name: data.pickupIdentity.name || '',
          source: data.pickupIdentity.source || '',
        })
      }
    } catch (e) {
      setLogoError(e?.message || 'Logo upload failed')
    } finally {
      setLogoUploading(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const handleLogoRemove = async () => {
    setLogoRemoving(true)
    setLogoError(null)
    setSaveOk(false)
    try {
      const data = await deleteAdminShipmozoLabelLogo()
      if (!data?.settings) throw new Error('Could not remove logo')
      setSettings(data.settings)
    } catch (e) {
      setLogoError(e?.message || 'Could not remove logo')
    } finally {
      setLogoRemoving(false)
    }
  }

  const s = settings
  const storefrontLabel = storefront === 'wholesale' ? 'Wholesale' : 'E-comm'

  const lockedNote = useMemo(
    () =>
      `Applies only to ${storefrontLabel} Shipmozo orders. Shiprocket labels are unchanged. Print size is 4×6 inch.`,
    [storefrontLabel]
  )

  if (loading) {
    return (
      <div className="admin-label-settings__state">
        <Loader2 size={20} className="admin-settings-profile__spin" />
        Loading label settings…
      </div>
    )
  }

  if (fetchError || !s) {
    return (
      <div className="admin-label-settings__alert admin-label-settings__alert--error">
        <AlertCircle size={18} />
        <span>{fetchError || 'Settings unavailable'}</span>
        <button type="button" onClick={loadSettings}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="admin-label-settings">
      <div className="admin-label-settings__head">
        <div>
          <h1 className="admin-label-settings__title">Shipmozo label settings</h1>
          <p className="admin-label-settings__desc">{lockedNote}</p>
          <p className="admin-label-settings__storefront">Storefront: {storefrontLabel}</p>
        </div>
        <button
          type="button"
          className="admin-label-settings__save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 size={16} className="admin-settings-profile__spin" /> : <Save size={16} />}
          Save
        </button>
      </div>

      {saveError ? (
        <div className="admin-label-settings__alert admin-label-settings__alert--error">{saveError}</div>
      ) : null}
      {saveOk ? (
        <div className="admin-label-settings__alert admin-label-settings__alert--ok">
          <CheckCircle2 size={16} />
          Saved for {storefrontLabel} only
        </div>
      ) : null}

      <div className="admin-label-settings__layout">
        <div className="admin-label-settings__form">
          <Section title="Label logo">
            <Toggle
              checked={s.branding?.showLogo}
              label="Print logo on label (Ship To section, right side)"
              onChange={(v) => patch('branding', 'showLogo', v)}
            />
            <div className="admin-label-settings__logo-row">
              {s.branding?.logoUrl ? (
                <div className="admin-label-settings__logo-preview">
                  <img src={s.branding.logoUrl} alt="Label logo preview" />
                </div>
              ) : (
                <div className="admin-label-settings__logo-empty">No logo</div>
              )}
              <div className="admin-label-settings__logo-actions">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="admin-label-settings__file"
                  onChange={handleLogoUpload}
                />
                <button
                  type="button"
                  className="admin-label-settings__ghost-btn"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading || logoRemoving}
                >
                  {logoUploading ? (
                    <Loader2 size={16} className="admin-settings-profile__spin" />
                  ) : (
                    <ImagePlus size={16} />
                  )}
                  {s.branding?.logoUrl ? 'Replace logo' : 'Upload logo'}
                </button>
                {s.branding?.logoUrl ? (
                  <button
                    type="button"
                    className="admin-label-settings__danger-btn"
                    onClick={handleLogoRemove}
                    disabled={logoUploading || logoRemoving}
                  >
                    {logoRemoving ? (
                      <Loader2 size={16} className="admin-settings-profile__spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Remove logo
                  </button>
                ) : null}
              </div>
            </div>
            {logoError ? <p className="admin-label-settings__field-error">{logoError}</p> : null}
            <p className="admin-label-settings__hint admin-label-settings__hint--full">
              Saved separately for {storefrontLabel} only (Cloudinary). Max 1 MB. PNG, JPG, or WebP.
              Logo prints centered beside Ship To — no vertical divider line.
            </p>
          </Section>

          <Section title="Support details">
            <Toggle
              checked={s.support?.showCustomerSupport}
              label="Customer support details"
              onChange={(v) => patch('support', 'showCustomerSupport', v)}
            />
            <input
              className="admin-label-settings__input admin-label-settings__input--full"
              placeholder="Support mobile"
              value={s.support?.mobile || ''}
              onChange={(e) => patch('support', 'mobile', e.target.value)}
            />
            <input
              className="admin-label-settings__input admin-label-settings__input--full"
              placeholder="Support email"
              value={s.support?.email || ''}
              onChange={(e) => patch('support', 'email', e.target.value)}
            />
          </Section>

          <Section title="Delivery details">
            <Toggle
              checked={s.delivery?.showPaymentMode}
              label="Payment mode"
              onChange={(v) => patch('delivery', 'showPaymentMode', v)}
            />
            <Toggle
              checked={s.delivery?.showCustomerAddress}
              label="Customer address"
              onChange={(v) => patch('delivery', 'showCustomerAddress', v)}
            />
            <Toggle
              checked={s.delivery?.showCustomerPhone}
              label="Customer phone number"
              onChange={(v) => patch('delivery', 'showCustomerPhone', v)}
            />
            <Toggle
              checked={s.delivery?.showOrderBarcode}
              label="Order barcode"
              onChange={(v) => patch('delivery', 'showOrderBarcode', v)}
            />
            <Toggle
              checked={s.delivery?.showAwbBarcode}
              label="AWB barcode"
              onChange={(v) => patch('delivery', 'showAwbBarcode', v)}
            />
            <Toggle
              checked={s.delivery?.showRoutingCode}
              label="Routing code"
              onChange={(v) => patch('delivery', 'showRoutingCode', v)}
            />
            <Toggle
              checked={s.delivery?.showRtoRoutingCode}
              label="RTO routing code"
              onChange={(v) => patch('delivery', 'showRtoRoutingCode', v)}
            />
            <Toggle checked locked label="Dimension" onChange={() => {}} />
            <Toggle checked locked label="Weight" onChange={() => {}} />
          </Section>

          <Section title="Pickup details">
            <Toggle
              checked={s.pickup?.showPickupName}
              label="Pickup name"
              onChange={(v) => patch('pickup', 'showPickupName', v)}
            />
            <Toggle
              checked={s.pickup?.showPickupAddress}
              label="Pickup address"
              onChange={(v) => patch('pickup', 'showPickupAddress', v)}
            />
            <Toggle
              checked={s.pickup?.showPickupPhone}
              label="Pickup phone number"
              onChange={(v) => patch('pickup', 'showPickupPhone', v)}
            />
            <Toggle
              checked={s.pickup?.showGstin}
              label="GSTIN"
              onChange={(v) => patch('pickup', 'showGstin', v)}
            />
            {pickupIdentity.source === 'shipmozo' ? (
              <p className="admin-label-settings__note admin-label-settings__note--full">
                Shipped By name comes from your Shipmozo warehouse
                {pickupIdentity.name ? `: ${pickupIdentity.name}` : ''}. It is not editable here.
              </p>
            ) : (
              <label className="admin-label-settings__field admin-label-settings__field--full">
                Shipped By name
                <input
                  className="admin-label-settings__input"
                  placeholder="Name printed under Shipped By"
                  value={s.pickup?.sellerName || ''}
                  onChange={(e) => patch('pickup', 'sellerName', e.target.value)}
                />
                <span className="admin-label-settings__hint">
                  Not coming from Shipmozo warehouse, so you can set it here.
                </span>
              </label>
            )}
            <input
              className="admin-label-settings__input admin-label-settings__input--full"
              placeholder="GSTXxxxxxxxxx"
              value={s.pickup?.gstin || ''}
              onChange={(e) => patch('pickup', 'gstin', e.target.value)}
            />
            <label className="admin-label-settings__field">
              Trim SKU upto
              <input
                type="number"
                min={4}
                max={40}
                className="admin-label-settings__input"
                placeholder="10"
                value={s.products?.trimSkuUpto ?? 10}
                onChange={(e) => patch('products', 'trimSkuUpto', e.target.value)}
              />
            </label>
            <label className="admin-label-settings__field">
              Trim product name upto
              <input
                type="number"
                min={4}
                max={40}
                className="admin-label-settings__input"
                placeholder="10"
                value={s.products?.trimProductNameUpto ?? 10}
                onChange={(e) => patch('products', 'trimProductNameUpto', e.target.value)}
              />
            </label>
            <label className="admin-label-settings__field admin-label-settings__field--full">
              Show number of line items
              <input
                type="number"
                min={1}
                max={30}
                className="admin-label-settings__input"
                placeholder="10"
                value={s.products?.maxLineItems ?? 10}
                onChange={(e) => patch('products', 'maxLineItems', e.target.value)}
              />
            </label>
          </Section>

          <Section title="Order & product details">
            <Toggle
              checked={s.products?.showItem}
              label="Item"
              onChange={(v) => patch('products', 'showItem', v)}
            />
            <Toggle
              checked={s.products?.showSku}
              label="SKU"
              onChange={(v) => patch('products', 'showSku', v)}
            />
            <Toggle
              checked={s.products?.showQty}
              label="Quantity"
              onChange={(v) => patch('products', 'showQty', v)}
            />
            <Toggle
              checked={s.products?.showPrice}
              label="Price"
              onChange={(v) => patch('products', 'showPrice', v)}
            />
            <Toggle
              checked={s.products?.showTotal}
              label="Total amount"
              onChange={(v) => patch('products', 'showTotal', v)}
            />
            <Toggle
              checked={s.products?.showHsn}
              label="HSN"
              onChange={(v) => patch('products', 'showHsn', v)}
            />
            <Toggle
              checked={s.products?.showShippingCharges}
              label="Shipping charges"
              onChange={(v) => patch('products', 'showShippingCharges', v)}
            />
            <Toggle
              checked={s.products?.showCollectableAmount}
              label="Collectable amount"
              onChange={(v) => patch('products', 'showCollectableAmount', v)}
            />
            <Toggle
              checked={s.products?.showTotalQuantity}
              label="Total quantity"
              onChange={(v) => patch('products', 'showTotalQuantity', v)}
            />
            <Toggle
              checked={s.products?.showAllItems}
              label="Show all items"
              onChange={(v) => patch('products', 'showAllItems', v)}
            />
          </Section>

          <Section title="Miscellaneous">
            <Toggle
              checked={s.misc?.showNotes}
              label="Notes"
              onChange={(v) => patch('misc', 'showNotes', v)}
            />
            <Toggle
              checked={s.misc?.showInvoiceNumber}
              label="Invoice number"
              onChange={(v) => patch('misc', 'showInvoiceNumber', v)}
            />
            <Toggle
              checked={s.misc?.showInvoiceDate}
              label="Invoice date"
              onChange={(v) => patch('misc', 'showInvoiceDate', v)}
            />
            <Toggle
              checked={s.misc?.showOrderDate}
              label="Order date"
              onChange={(v) => patch('misc', 'showOrderDate', v)}
            />
            <Toggle
              checked={s.misc?.showOrderTotal}
              label="Show order total"
              onChange={(v) => patch('misc', 'showOrderTotal', v)}
            />
            <Toggle
              checked={s.misc?.showEwayBill}
              label="E-way bill no"
              onChange={(v) => patch('misc', 'showEwayBill', v)}
            />
            <Toggle
              checked={s.misc?.showPoweredBy}
              label="Powered by store"
              onChange={(v) => patch('misc', 'showPoweredBy', v)}
            />
            <Toggle
              checked={s.misc?.showAutoGeneratedDisclaimer}
              label="Auto-generated disclaimer"
              onChange={(v) => patch('misc', 'showAutoGeneratedDisclaimer', v)}
            />
            <label className="admin-label-settings__field admin-label-settings__field--full" style={{ marginTop: '4px' }}>
              Custom Notes / Terms
              <textarea
                className="admin-label-settings__textarea"
                placeholder="Custom disclaimer or notes printed on label..."
                value={s.misc?.notes || ''}
                onChange={(e) => patch('misc', 'notes', e.target.value)}
              />
            </label>
          </Section>
        </div>

        <div className="admin-label-settings__preview-col">
          <div className="admin-label-settings__preview-head">
            <h3>Label preview (4×6)</h3>
            <button
              type="button"
              className="admin-label-settings__print"
              onClick={handlePrint}
              disabled={!previewHtml}
            >
              <Printer size={14} />
              Print
            </button>
          </div>
          {previewError ? <p className="admin-label-settings__field-error">{previewError}</p> : null}
          <div className="admin-label-settings__preview-frame">
            <div className="admin-label-settings__preview-paper">
              <iframe
                ref={iframeRef}
                title="Shipmozo label preview"
                scrolling="no"
                srcDoc={
                  previewHtml ||
                  "<p style='padding:12px;font-family:sans-serif;color:#666'>Loading preview…</p>"
                }
              />
            </div>
          </div>
          <p className="admin-label-settings__preview-note">
            Preview stays here while you change fields on the left. Print uses 4×6 paper. Example
            barcodes in preview; real Shipmozo orders print the actual AWB and order ID.
          </p>
        </div>
      </div>
    </div>
  )
}
