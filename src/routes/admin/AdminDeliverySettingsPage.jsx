import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  BadgeDollarSign,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MapPin,
  ShoppingBag,
  Truck,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { extractListPayload } from '@/features/admin/components/AdminUi'
import {
  useAdminCheckoutSettings,
  useAdminFreeShippingOffers,
  useAdminShippingSettings,
  useAdminShipmozoWarehouses,
  useCreateAdminFreeShippingOffer,
  useTestAdminShippingConnection,
  useUpdateAdminCheckoutSettings,
  useUpdateAdminFreeShippingOffer,
  useUpdateAdminShippingSettings,
} from '@/features/admin/hooks'

const SECTIONS = [
  {
    title: 'Delivery charges',
    items: [
      {
        id: 'min-order',
        title: 'Minimum order value for delivery',
        description: 'Set a minimum value for orders to be eligible for delivery.',
        icon: ShoppingBag,
        kind: 'min-order',
      },
      {
        id: 'delivery-charge',
        title: 'Delivery charge',
        description: 'Set charges for delivery.',
        icon: Truck,
        kind: 'delivery-charge',
      },
      {
        id: 'cod-charge',
        title: 'Cash on delivery charges',
        description: 'Switch on Cash on Delivery to set charges.',
        icon: Wallet,
        kind: 'cod',
      },
    ],
  },
  {
    title: 'Shipping',
    items: [
      {
        id: 'delivery-partners',
        title: 'Shipping partners (Shiprocket / Shipmozo)',
        description: 'Choose which partner handles NEW orders. Existing orders stay on their original partner.',
        icon: BadgeDollarSign,
        kind: 'shipping-partners',
      },
      {
        id: 'pickup-address',
        title: 'Pickup addresses',
        description: 'Set up & manage your pickup addresses.',
        icon: MapPin,
        kind: 'pickup',
      },
    ],
  },
]

function parseAmount(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100) / 100
}

export default function AdminDeliverySettingsPage() {
  const navigate = useNavigate()
  const [activeItem, setActiveItem] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)

  const shippingQ = useAdminShippingSettings()
  const checkoutQ = useAdminCheckoutSettings()
  const offersQ = useAdminFreeShippingOffers({ page: 1, status: 'all' })
  const updateShipping = useUpdateAdminShippingSettings()
  const updateCheckout = useUpdateAdminCheckoutSettings()
  const createOffer = useCreateAdminFreeShippingOffer()
  const updateOffer = useUpdateAdminFreeShippingOffer()
  const testConnection = useTestAdminShippingConnection()

  const shipping = shippingQ.data || {}
  const checkout = checkoutQ.data || {}
  const { items: offers } = useMemo(
    () => extractListPayload(offersQ.data, ['offers']),
    [offersQ.data]
  )
  const primaryOffer = useMemo(() => {
    const active = offers.find((o) => o.isActive !== false)
    return active || offers[0] || null
  }, [offers])

  const [activeProvider, setActiveProvider] = useState('shiprocket')
  const [warehouseId, setWarehouseId] = useState('')
  const [pickupPincode, setPickupPincode] = useState('')
  const [minOrderValue, setMinOrderValue] = useState('')
  const [codEnabled, setCodEnabled] = useState(true)
  const [testMsg, setTestMsg] = useState(null)

  const warehousesEnabled =
    activeItem?.kind === 'pickup' || activeItem?.kind === 'shipping-partners'
  const warehousesQ = useAdminShipmozoWarehouses({ enabled: Boolean(warehousesEnabled) })

  useEffect(() => {
    if (!shippingQ.data) return
    const d = shippingQ.data
    setActiveProvider(d.activeProvider === 'shipmozo' ? 'shipmozo' : 'shiprocket')
    setWarehouseId(d.shipmozo?.warehouseId != null ? String(d.shipmozo.warehouseId) : '')
    setPickupPincode(d.shipmozo?.pickupPincode != null ? String(d.shipmozo.pickupPincode) : '')
  }, [shippingQ.data])

  useEffect(() => {
    if (!checkoutQ.data) return
    setCodEnabled(Boolean(checkoutQ.data.codEnabled))
  }, [checkoutQ.data])

  useEffect(() => {
    if (primaryOffer?.minCartValue != null) {
      setMinOrderValue(String(primaryOffer.minCartValue))
    } else {
      setMinOrderValue('599')
    }
  }, [primaryOffer])

  useEffect(() => {
    if (!activeItem) {
      setTestMsg(null)
    }
  }, [activeItem])

  const keysConfigured = Boolean(shipping.shipmozo?.keysConfigured)
  const shipmozoReady = Boolean(shipping.shipmozo?.ready)
  const missing = Array.isArray(shipping.shipmozo?.missing) ? shipping.shipmozo.missing : []
  const busy =
    updateShipping.isPending ||
    updateCheckout.isPending ||
    createOffer.isPending ||
    updateOffer.isPending

  const openModal = (item) => {
    setActiveItem(item)
    setTestMsg(null)
  }

  const closeModal = () => {
    if (busy) return
    setActiveItem(null)
  }

  const saveShippingPartner = async () => {
    try {
      await updateShipping.mutateAsync({
        activeProvider,
        shipmozo: {
          warehouseId: warehouseId.trim() || null,
          pickupPincode: pickupPincode.trim() || null,
        },
      })
      toast.success(`Saved. New checkouts will use ${activeProvider === 'shipmozo' ? 'Shipmozo' : 'Shiprocket'}.`)
      setActiveItem(null)
    } catch (err) {
      toast.error(err?.message || 'Could not save shipping partner')
    }
  }

  const savePickup = async () => {
    try {
      await updateShipping.mutateAsync({
        activeProvider: shipping.activeProvider === 'shipmozo' ? 'shipmozo' : activeProvider,
        shipmozo: {
          warehouseId: warehouseId.trim() || null,
          pickupPincode: pickupPincode.trim() || null,
        },
      })
      toast.success('Pickup address saved')
      setActiveItem(null)
    } catch (err) {
      toast.error(err?.message || 'Could not save pickup address')
    }
  }

  const saveMinOrder = async () => {
    const amount = parseAmount(minOrderValue)
    if (amount == null || amount <= 0) {
      toast.error('Enter a valid amount greater than 0')
      return
    }
    try {
      if (primaryOffer?._id || primaryOffer?.id) {
        await updateOffer.mutateAsync({
          id: primaryOffer._id || primaryOffer.id,
          name: primaryOffer.name || 'Free shipping threshold',
          description: primaryOffer.description || 'Orders at or above this amount get free delivery',
          minCartValue: amount,
          endDate: primaryOffer.endDate || null,
          isActive: primaryOffer.isActive !== false,
        })
      } else {
        await createOffer.mutateAsync({
          name: 'Free shipping threshold',
          description: 'Orders at or above this amount get free delivery',
          minCartValue: amount,
          isActive: true,
        })
      }
      toast.success('Minimum order value saved')
      setActiveItem(null)
    } catch (err) {
      toast.error(err?.message || 'Could not save minimum order value')
    }
  }

  const saveCod = async () => {
    try {
      const body = checkout.partialPaymentEnabled
        ? {
            codEnabled,
            partialPaymentEnabled: true,
            partialPaymentPercent: checkout.partialPaymentPercent,
          }
        : {
            codEnabled,
            partialPaymentEnabled: false,
          }
      await updateCheckout.mutateAsync(body)
      toast.success(codEnabled ? 'Cash on delivery enabled' : 'Cash on delivery disabled')
      setActiveItem(null)
    } catch (err) {
      toast.error(err?.message || 'Could not update COD settings')
    }
  }

  const handleTestShipmozo = async () => {
    setTestMsg(null)
    try {
      const res = await testConnection.mutateAsync({})
      setTestMsg({ ok: true, text: res?.message || 'Shipmozo API reachable' })
    } catch (err) {
      setTestMsg({ ok: false, text: err?.message || 'Connection test failed' })
    }
  }

  const handleLoadWarehouses = async () => {
    setTestMsg(null)
    try {
      const list = await warehousesQ.refetch()
      const warehouses = list.data || []
      if (!warehouses.length) {
        setTestMsg({ ok: false, text: 'No warehouses returned from Shipmozo' })
        return
      }
      const def = warehouses.find((w) => String(w.default).toUpperCase() === 'YES') || warehouses[0]
      if (def?.id != null) {
        setWarehouseId(String(def.id))
        if (def.pincode) setPickupPincode(String(def.pincode).replace(/\D/g, '').slice(0, 6))
        setTestMsg({
          ok: true,
          text: `Loaded warehouse ${def.address_title || def.id} (id ${def.id})`,
        })
      }
    } catch (err) {
      setTestMsg({ ok: false, text: err?.message || 'Failed to load warehouses' })
    }
  }

  const selectWarehouse = (w) => {
    if (w?.id == null) return
    setWarehouseId(String(w.id))
    if (w.pincode) setPickupPincode(String(w.pincode).replace(/\D/g, '').slice(0, 6))
  }

  const pageLoading = shippingQ.isLoading && !shippingQ.data
  const pageError = shippingQ.isError && !shippingQ.data

  return (
    <div className="admin-page admin-delivery">
      <header className="admin-delivery__head">
        <p className="admin-delivery__eyebrow">Delivery</p>
        <h1 className="admin-delivery__title">Delivery settings</h1>
      </header>

      {pageLoading && (
        <div className="admin-empty">
          <Loader2 className="payment-overlay__spinner" size={24} />
          <p>Loading delivery settings…</p>
        </div>
      )}

      {pageError && (
        <div className="admin-empty">
          <p>{shippingQ.error?.message || checkoutQ.error?.message || 'Could not load settings'}</p>
          <Button
            variant="secondary"
            onClick={() => {
              shippingQ.refetch()
              checkoutQ.refetch()
              offersQ.refetch()
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {!pageLoading && !pageError && (
        <div className="admin-delivery__stack">
          {SECTIONS.map((section) => (
            <section key={section.title} className="admin-delivery__card">
              <div className="admin-delivery__card-head">
                <span>{section.title}</span>
              </div>
              <div className="admin-delivery__list">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isHot = hoveredId === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`admin-delivery__row${isHot ? ' is-active' : ''}`}
                      onClick={() => openModal(item)}
                      onMouseEnter={() => setHoveredId(item.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onFocus={() => setHoveredId(item.id)}
                      onBlur={() => setHoveredId(null)}
                    >
                      <span className="admin-delivery__row-left">
                        <span className="admin-delivery__icon" aria-hidden>
                          <Icon size={20} />
                        </span>
                        <span>
                          <span className="admin-delivery__row-title">{item.title}</span>
                          <span className="admin-delivery__row-desc">{item.description}</span>
                        </span>
                      </span>
                      <ChevronRight size={18} className="admin-delivery__chevron" aria-hidden />
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(activeItem)}
        onOpenChange={(open) => {
          if (!open) closeModal()
        }}
        title={activeItem?.title || 'Settings'}
        className="modal-content--delivery-settings"
        footer={
          <div className="admin-delivery-modal__footer">
            <button type="button" className="admin-delivery-modal__cancel" onClick={closeModal} disabled={busy}>
              Cancel
            </button>
            {activeItem?.kind === 'shipping-partners' && (
              <button
                type="button"
                className="admin-delivery-modal__save"
                onClick={saveShippingPartner}
                disabled={busy || shippingQ.isLoading}
              >
                {updateShipping.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            )}
            {activeItem?.kind === 'pickup' && (
              <button type="button" className="admin-delivery-modal__save" onClick={savePickup} disabled={busy}>
                {updateShipping.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            )}
            {activeItem?.kind === 'min-order' && (
              <button type="button" className="admin-delivery-modal__save" onClick={saveMinOrder} disabled={busy}>
                {createOffer.isPending || updateOffer.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            )}
            {activeItem?.kind === 'cod' && (
              <button type="button" className="admin-delivery-modal__save" onClick={saveCod} disabled={busy}>
                {updateCheckout.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            )}
            {activeItem?.kind === 'delivery-charge' && (
              <button
                type="button"
                className="admin-delivery-modal__save"
                onClick={() => openModal(SECTIONS[1].items[0])}
              >
                Open shipping partners
              </button>
            )}
          </div>
        }
      >
        {activeItem?.kind === 'shipping-partners' && (
          <div className="admin-delivery-modal__body">
            <p className="admin-delivery-modal__lead">
              Active partner is used for <strong>checkout rates and new orders only</strong>. Orders already
              created on Shiprocket keep processing on Shiprocket after you switch.
            </p>

            {shippingQ.isLoading ? (
              <div className="admin-delivery-modal__status">
                <Loader2 size={16} className="payment-overlay__spinner" /> Loading…
              </div>
            ) : shippingQ.isError ? (
              <div className="admin-delivery-modal__alert admin-delivery-modal__alert--error">
                <AlertCircle size={16} />
                <span>{shippingQ.error?.message || 'Could not load shipping settings'}</span>
              </div>
            ) : (
              <>
                <div className="admin-delivery-modal__field">
                  <span className="admin-delivery-modal__label">Active partner for new orders</span>
                  <div className="admin-delivery-modal__providers">
                    {[
                      { id: 'shiprocket', label: 'Shiprocket' },
                      { id: 'shipmozo', label: 'Shipmozo' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`admin-delivery-modal__provider${activeProvider === opt.id ? ' is-selected' : ''}`}
                        onClick={() => setActiveProvider(opt.id)}
                      >
                        <strong>{opt.label}</strong>
                        {opt.id === 'shipmozo' && (
                          <span>{shipmozoReady ? 'Ready' : `Missing: ${missing.join(', ') || 'setup'}`}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {activeProvider === 'shiprocket' ? (
                  <div className="admin-delivery-modal__alert admin-delivery-modal__alert--ok">
                    <CheckCircle2 size={14} />
                    <span>
                      Shiprocket uses your existing Shiprocket account settings. Warehouse ID and pickup pincode
                      are only needed for Shipmozo.
                    </span>
                  </div>
                ) : (
                  <div className="admin-delivery-modal__divider">
                    <h3>Shipmozo setup</h3>
                    <div
                      className={`admin-delivery-modal__alert ${
                        keysConfigured
                          ? 'admin-delivery-modal__alert--ok'
                          : 'admin-delivery-modal__alert--warn'
                      }`}
                    >
                      {keysConfigured ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      <span>
                        {keysConfigured
                          ? 'API keys configured via server env (SHIPMOZO_PUBLIC_KEY / SHIPMOZO_PRIVATE_KEY). Keys cannot be entered here.'
                          : 'API keys missing in server env. Set SHIPMOZO_PUBLIC_KEY and SHIPMOZO_PRIVATE_KEY, then restart the server.'}
                      </span>
                    </div>

                    <InputGroup label="Warehouse ID" htmlFor="warehouseId">
                      <Input
                        id="warehouseId"
                        value={warehouseId}
                        onChange={(e) => setWarehouseId(e.target.value)}
                        placeholder="Shipmozo warehouse id"
                      />
                    </InputGroup>
                    <InputGroup label="Shipmozo pickup pincode" htmlFor="pickupPincode">
                      <Input
                        id="pickupPincode"
                        inputMode="numeric"
                        maxLength={6}
                        value={pickupPincode}
                        onChange={(e) => setPickupPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit pincode"
                      />
                    </InputGroup>

                    <div className="admin-delivery-modal__actions-row">
                      <button
                        type="button"
                        className="admin-delivery-modal__ghost-btn"
                        onClick={handleLoadWarehouses}
                        disabled={!keysConfigured || warehousesQ.isFetching}
                      >
                        {warehousesQ.isFetching ? 'Loading…' : 'Load warehouses from Shipmozo'}
                      </button>
                      <button
                        type="button"
                        className="admin-delivery-modal__ghost-btn"
                        onClick={handleTestShipmozo}
                        disabled={!keysConfigured || testConnection.isPending}
                      >
                        {testConnection.isPending ? 'Testing…' : 'Test Shipmozo connection'}
                      </button>
                    </div>

                    {testMsg && (
                      <div
                        className={`admin-delivery-modal__alert ${
                          testMsg.ok ? 'admin-delivery-modal__alert--ok' : 'admin-delivery-modal__alert--error'
                        }`}
                      >
                        {testMsg.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        <span>{testMsg.text}</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeItem?.kind === 'pickup' && (
          <div className="admin-delivery-modal__body">
            <p className="admin-delivery-modal__lead">
              Pickup location used when creating Shipmozo shipments. Load warehouses from Shipmozo or enter the
              warehouse ID and pincode manually.
            </p>

            {!keysConfigured && (
              <div className="admin-delivery-modal__alert admin-delivery-modal__alert--warn">
                <AlertCircle size={14} />
                <span>Configure Shipmozo API keys on the server before loading warehouses.</span>
              </div>
            )}

            <InputGroup label="Warehouse ID" htmlFor="pickup-warehouse">
              <Input
                id="pickup-warehouse"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              />
            </InputGroup>
            <InputGroup label="Pickup pincode" htmlFor="pickup-pin">
              <Input
                id="pickup-pin"
                inputMode="numeric"
                maxLength={6}
                value={pickupPincode}
                onChange={(e) => setPickupPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </InputGroup>

            <div className="admin-delivery-modal__actions-row">
              <button
                type="button"
                className="admin-delivery-modal__ghost-btn"
                onClick={handleLoadWarehouses}
                disabled={!keysConfigured || warehousesQ.isFetching}
              >
                {warehousesQ.isFetching ? 'Loading…' : 'Refresh warehouses'}
              </button>
            </div>

            {Array.isArray(warehousesQ.data) && warehousesQ.data.length > 0 && (
              <div className="admin-delivery-modal__warehouse-list">
                {warehousesQ.data.map((w) => {
                  const id = String(w.id)
                  const selected = warehouseId === id
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`admin-delivery-modal__warehouse${selected ? ' is-selected' : ''}`}
                      onClick={() => selectWarehouse(w)}
                    >
                      <strong>{w.address_title || `Warehouse ${id}`}</strong>
                      <span>
                        ID {id}
                        {w.pincode ? ` · ${w.pincode}` : ''}
                        {String(w.default).toUpperCase() === 'YES' ? ' · Default' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {testMsg && (
              <div
                className={`admin-delivery-modal__alert ${
                  testMsg.ok ? 'admin-delivery-modal__alert--ok' : 'admin-delivery-modal__alert--error'
                }`}
              >
                {testMsg.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{testMsg.text}</span>
              </div>
            )}
          </div>
        )}

        {activeItem?.kind === 'min-order' && (
          <div className="admin-delivery-modal__body">
            <p className="admin-delivery-modal__lead">
              Orders at or above this cart value qualify for free delivery (via your free shipping offer).
            </p>
            <InputGroup label="Minimum cart value (₹)" htmlFor="min-order-value">
              <Input
                id="min-order-value"
                type="number"
                min="0"
                step="1"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                placeholder="599"
              />
            </InputGroup>
            {primaryOffer && (
              <p className="admin-delivery-modal__hint">
                Updating offer: <strong>{primaryOffer.name}</strong>
              </p>
            )}
            <button
              type="button"
              className="admin-delivery-modal__link"
              onClick={() => navigate('/admin/marketing/offers')}
            >
              Manage all free shipping offers →
            </button>
          </div>
        )}

        {activeItem?.kind === 'delivery-charge' && (
          <div className="admin-delivery-modal__body">
            <p className="admin-delivery-modal__lead">
              Delivery charges are calculated live by your active shipping partner (Shiprocket / Shipmozo) at
              checkout based on weight, pincode, and courier rates.
            </p>
            <div className="admin-delivery-modal__alert admin-delivery-modal__alert--ok">
              <CheckCircle2 size={14} />
              <span>
                Active partner:{' '}
                <strong>
                  {String(shipping.activeProvider || activeProvider) === 'shipmozo' ? 'Shipmozo' : 'Shiprocket'}
                </strong>
              </span>
            </div>
            <p className="admin-delivery-modal__hint">
              To change how rates are sourced, open Shipping partners. To waive delivery above a cart amount,
              set the minimum order value.
            </p>
            <div className="admin-delivery-modal__actions-row">
              <button
                type="button"
                className="admin-delivery-modal__ghost-btn"
                onClick={() => openModal(SECTIONS[0].items[0])}
              >
                Edit free-delivery threshold
              </button>
            </div>
          </div>
        )}

        {activeItem?.kind === 'cod' && (
          <div className="admin-delivery-modal__body">
            <p className="admin-delivery-modal__lead">
              Enable Cash on Delivery so customers can pay when the order arrives. Courier COD fees (if any) are
              applied by your shipping partner at checkout.
            </p>
            {checkoutQ.isLoading ? (
              <div className="admin-delivery-modal__status">
                <Loader2 size={16} className="payment-overlay__spinner" /> Loading…
              </div>
            ) : (
              <label className="admin-delivery-modal__toggle">
                <input
                  type="checkbox"
                  checked={codEnabled}
                  onChange={(e) => setCodEnabled(e.target.checked)}
                />
                <span>
                  <strong>Cash on delivery enabled</strong>
                  <em>Customers can choose COD at checkout when this is on.</em>
                </span>
              </label>
            )}
            <button
              type="button"
              className="admin-delivery-modal__link"
              onClick={() => navigate('/admin/settings/payment')}
            >
              Open full payment policy →
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
