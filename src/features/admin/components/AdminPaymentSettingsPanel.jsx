import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Loader2,
  Receipt,
  RefreshCw,
  Store,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useAdminCheckoutSettings,
  useUpdateAdminCheckoutSettings,
} from '@/features/admin/hooks'

function clampPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const rounded = Math.round(n * 100) / 100
  if (rounded < 1 || rounded > 100) return null
  return rounded
}

export function AdminPaymentSettingsPanel() {
  const { data, isLoading, isError, error, refetch } = useAdminCheckoutSettings()
  const updateSettings = useUpdateAdminCheckoutSettings()

  const [storefront, setStorefront] = useState('retail')
  const [codEnabled, setCodEnabled] = useState(true)
  const [partialEnabled, setPartialEnabled] = useState(false)
  const [partialPercentInput, setPartialPercentInput] = useState('60')
  const [saveOk, setSaveOk] = useState(false)

  useEffect(() => {
    if (!data) return
    setCodEnabled(Boolean(data.codEnabled))
    setPartialEnabled(Boolean(data.partialPaymentEnabled))
    if (data.partialPaymentPercent != null) {
      setPartialPercentInput(String(data.partialPaymentPercent))
    }
  }, [data])

  const handleSave = async () => {
    setSaveOk(false)
    const parsed = clampPercent(partialPercentInput)
    if (partialEnabled && parsed == null) {
      toast.error('Enter a valid percentage between 1 and 100')
      return
    }

    const body = partialEnabled
      ? {
          codEnabled,
          partialPaymentEnabled: true,
          partialPaymentPercent: parsed,
        }
      : {
          codEnabled,
          partialPaymentEnabled: false,
        }

    try {
      await updateSettings.mutateAsync(body)
      setSaveOk(true)
      toast.success('Checkout payment policy saved')
    } catch (err) {
      toast.error(err?.message || 'Save failed')
    }
  }

  const handleReload = () => {
    setSaveOk(false)
    refetch()
    toast.message('Refreshed payment settings')
  }

  if (isLoading) {
    return (
      <div className="admin-payment-settings__loading">
        <Loader2 className="admin-settings-profile__spin" size={24} />
        <p>Loading payment settings…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="admin-payment-settings__error">
        <p>{error?.message || 'Could not load payment settings'}</p>
        <button type="button" className="admin-payment-settings__btn-secondary" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="admin-payment-settings__stack">
      {/* CARD 1: CHECKOUT - COD & PARTIAL PAYMENT */}
      <section className="admin-payment-settings__card">
        <div className="admin-payment-settings__card-head">
          <Store size={16} aria-hidden />
          <h2>CHECKOUT — CASH ON DELIVERY &amp; PARTIAL PAYMENT</h2>
        </div>

        <div className="admin-payment-settings__card-body">
          {/* STOREFRONT DROPDOWN */}
          <div className="admin-payment-settings__field">
            <label className="admin-payment-settings__label" htmlFor="payment-storefront-select">
              STOREFRONT
            </label>
            <select
              id="payment-storefront-select"
              className="admin-payment-settings__select"
              value={storefront}
              onChange={(e) => setStorefront(e.target.value)}
            >
              <option value="retail">Retail (e-commerce)</option>
              <option value="wholesale">Wholesale</option>
            </select>
            <span className="admin-payment-settings__hint">
              Policy is stored per storefront. Uses your admin scope: wrong scope returns access denied.
            </span>
          </div>

          {/* CHECKBOX 1: CASH ON DELIVERY */}
          <label className="admin-payment-settings__checkbox-row">
            <input
              type="checkbox"
              checked={codEnabled}
              onChange={(e) => setCodEnabled(e.target.checked)}
              className="admin-payment-settings__checkbox"
            />
            <div>
              <span className="admin-payment-settings__checkbox-title">Cash on delivery</span>
              <p className="admin-payment-settings__checkbox-desc">
                When off, customers only see online payment at checkout.
              </p>
            </div>
          </label>

          {/* CHECKBOX 2: PARTIAL PAYMENT ONLINE */}
          <label className="admin-payment-settings__checkbox-row">
            <input
              type="checkbox"
              checked={partialEnabled}
              onChange={(e) => setPartialEnabled(e.target.checked)}
              className="admin-payment-settings__checkbox"
            />
            <div>
              <span className="admin-payment-settings__checkbox-title">Partial payment online</span>
              <p className="admin-payment-settings__checkbox-desc">
                When on, customers can pay a fixed percentage now (set below) and the balance later. When off, online checkout is full payment only.
              </p>
            </div>
          </label>

          {/* PARTIAL PERCENT INPUT */}
          {partialEnabled && (
            <div className="admin-payment-settings__field admin-payment-settings__field--inline">
              <label className="admin-payment-settings__label" htmlFor="partialPercent">
                PARTIAL PAYMENT PERCENT (1–100)
              </label>
              <input
                id="partialPercent"
                type="number"
                min="1"
                max="100"
                className="admin-payment-settings__input admin-payment-settings__input--short"
                value={partialPercentInput}
                onChange={(e) => setPartialPercentInput(e.target.value)}
              />
            </div>
          )}

          {updateSettings.isError && (
            <div className="admin-payment-settings__alert admin-payment-settings__alert--error">
              {updateSettings.error?.message || 'Save failed'}
            </div>
          )}
          {saveOk && (
            <div className="admin-payment-settings__alert admin-payment-settings__alert--ok">
              <CheckCircle2 size={16} />
              Policy saved successfully.
            </div>
          )}

          {/* ACTIONS */}
          <div className="admin-payment-settings__actions">
            <button
              type="button"
              className="admin-payment-settings__btn-primary"
              onClick={handleSave}
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? (
                <Loader2 size={16} className="admin-settings-profile__spin" />
              ) : null}
              {updateSettings.isPending ? 'Saving…' : 'Save checkout policy'}
            </button>
            <button
              type="button"
              className="admin-payment-settings__btn-secondary"
              onClick={handleReload}
            >
              Reload
            </button>
          </div>
        </div>
      </section>

      {/* CARD 2: PAYMENT MODES */}
      <section className="admin-payment-settings__card">
        <div className="admin-payment-settings__card-head">
          <h2>PAYMENT MODES</h2>
        </div>
        <div className="admin-payment-settings__card-list">
          <div
            className="admin-payment-settings__row"
            role="button"
            tabIndex={0}
            onClick={() => toast.message('Online payment modes', { description: 'Gateway configuration coming soon.' })}
          >
            <div className="admin-payment-settings__row-left">
              <span className="admin-payment-settings__icon-box" aria-hidden>
                <CreditCard size={20} />
              </span>
              <div>
                <h3 className="admin-payment-settings__row-title">Online payment modes</h3>
                <p className="admin-payment-settings__row-desc">Set how you want to accept payments online</p>
              </div>
            </div>
            <ChevronRight size={18} className="admin-payment-settings__chevron" aria-hidden />
          </div>
        </div>
      </section>

      {/* CARD 3: INVOICES & SETTLEMENTS */}
      <section className="admin-payment-settings__card">
        <div className="admin-payment-settings__card-head">
          <h2>INVOICES &amp; SETTLEMENTS</h2>
        </div>
        <div className="admin-payment-settings__card-list">
          <div
            className="admin-payment-settings__row"
            role="button"
            tabIndex={0}
            onClick={() => toast.message('GST billing', { description: 'GST invoice options coming soon.' })}
          >
            <div className="admin-payment-settings__row-left">
              <span className="admin-payment-settings__icon-box" aria-hidden>
                <FileText size={20} />
              </span>
              <div>
                <h3 className="admin-payment-settings__row-title">GST billing</h3>
                <p className="admin-payment-settings__row-desc">Generate GST invoices for customer orders</p>
              </div>
            </div>
            <ChevronRight size={18} className="admin-payment-settings__chevron" aria-hidden />
          </div>

          <div
            className="admin-payment-settings__row"
            role="button"
            tabIndex={0}
            onClick={() => toast.message('Settlement cycle', { description: 'Settlement details coming soon.' })}
          >
            <div className="admin-payment-settings__row-left">
              <span className="admin-payment-settings__icon-box" aria-hidden>
                <RefreshCw size={20} />
              </span>
              <div>
                <h3 className="admin-payment-settings__row-title">Settlement cycle</h3>
                <p className="admin-payment-settings__row-desc">Next day</p>
              </div>
            </div>
            <ChevronRight size={18} className="admin-payment-settings__chevron" aria-hidden />
          </div>

          <div
            className="admin-payment-settings__row"
            role="button"
            tabIndex={0}
            onClick={() => toast.message('Customer payment invoices', { description: 'Payment invoices coming soon.' })}
          >
            <div className="admin-payment-settings__row-left">
              <span className="admin-payment-settings__icon-box" aria-hidden>
                <Receipt size={20} />
              </span>
              <div>
                <h3 className="admin-payment-settings__row-title">Customer payment invoices</h3>
                <p className="admin-payment-settings__row-desc">View customer payment and settlements</p>
              </div>
            </div>
            <ChevronRight size={18} className="admin-payment-settings__chevron" aria-hidden />
          </div>
        </div>
      </section>
    </div>
  )
}
