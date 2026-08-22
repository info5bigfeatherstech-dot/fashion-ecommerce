import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
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

  const [codEnabled, setCodEnabled] = useState(true)
  const [partialEnabled, setPartialEnabled] = useState(false)
  const [partialPercentInput, setPartialPercentInput] = useState('25')
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
    if (partialEnabled && parsed == null) return

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
    } catch {
      /* toast handled by caller if needed */
    }
  }

  if (isLoading) {
    return (
      <div className="admin-empty">
        <Loader2 className="payment-overlay__spinner" size={24} />
        <p>Loading payment policy…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="admin-empty">
        <p>{error?.message || 'Could not load payment settings'}</p>
        <Button variant="secondary" onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="admin-card">
      <div className="admin-card__head">
        <div>
          <h2 className="admin-card__title">Checkout payment policy</h2>
          <p className="admin-card__subtitle">COD and partial payment rules for the storefront</p>
        </div>
      </div>

      <div className="admin-form-stack">
        <label className="admin-toggle">
          <input
            type="checkbox"
            checked={codEnabled}
            onChange={(e) => setCodEnabled(e.target.checked)}
          />
          <span>Cash on delivery enabled</span>
        </label>

        <label className="admin-toggle">
          <input
            type="checkbox"
            checked={partialEnabled}
            onChange={(e) => setPartialEnabled(e.target.checked)}
          />
          <span>Partial payment enabled</span>
        </label>

        {partialEnabled && (
          <InputGroup label="Advance percent (1–100)" htmlFor="partialPercent">
            <Input
              id="partialPercent"
              value={partialPercentInput}
              onChange={(e) => setPartialPercentInput(e.target.value)}
              inputMode="decimal"
            />
          </InputGroup>
        )}

        {updateSettings.isError && (
          <p className="admin-form-error">{updateSettings.error?.message || 'Save failed'}</p>
        )}
        {saveOk && <p className="admin-form-success">Settings saved.</p>}

        <Button
          variant="primary"
          onClick={handleSave}
          disabled={updateSettings.isPending}
        >
          {updateSettings.isPending ? 'Saving…' : 'Save policy'}
        </Button>
      </div>
    </div>
  )
}
