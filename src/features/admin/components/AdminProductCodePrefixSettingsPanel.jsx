import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, Tag } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAdminProductCodePrefixSettings,
  useUpdateAdminProductCodePrefixSettings,
} from '@/features/admin/hooks'

const PREFIX_MIN = 2
const PREFIX_MAX = 3

function normalizePrefixDraft(value) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, PREFIX_MAX)
}

export function AdminProductCodePrefixSettingsPanel() {
  const { data, isLoading, isError, error, refetch } = useAdminProductCodePrefixSettings()
  const updateSettings = useUpdateAdminProductCodePrefixSettings()

  const [prefixInput, setPrefixInput] = useState('')
  const [saveOk, setSaveOk] = useState(false)

  useEffect(() => {
    if (!data) return
    setPrefixInput(normalizePrefixDraft(data.prefix || ''))
  }, [data])

  const handleSave = async () => {
    setSaveOk(false)
    const prefix = normalizePrefixDraft(prefixInput)
    if (prefix.length < PREFIX_MIN || prefix.length > PREFIX_MAX) {
      toast.error(`Enter ${PREFIX_MIN}–${PREFIX_MAX} letters (e.g. FU or MTL)`)
      return
    }

    try {
      await updateSettings.mutateAsync({ prefix })
      setSaveOk(true)
      toast.success('Product code prefix saved. Only new listings will use it.')
    } catch (err) {
      toast.error(err?.message || 'Save failed')
    }
  }

  const handleReload = () => {
    setSaveOk(false)
    refetch()
    toast.message('Refreshed product code prefix')
  }

  if (isLoading) {
    return (
      <div className="admin-payment-settings__loading">
        <Loader2 className="admin-settings-profile__spin" size={24} />
        <p>Loading product code prefix…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="admin-payment-settings__error">
        <p>{error?.message || 'Could not load product code prefix settings'}</p>
        <button type="button" className="admin-payment-settings__btn-secondary" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    )
  }

  const configured = Boolean(data?.configured && data?.prefix)
  const exampleBare = '788-1'
  const exampleFinal = configured ? `${data.prefix}${exampleBare}` : `FU${exampleBare}`

  return (
    <div className="admin-payment-settings__stack">
      <section className="admin-payment-settings__card">
        <div className="admin-payment-settings__card-head">
          <Tag size={18} aria-hidden />
          <h2>Product code prefix</h2>
        </div>
        <div className="admin-payment-settings__card-body">
          <p className="admin-payment-settings__hint">
            Required before single or bulk listing. New products get this prefix automatically
            (e.g. <code>{exampleBare}</code> → <code>{exampleFinal}</code>). Changing the prefix
            never rewrites existing product codes.
          </p>

          {!configured && (
            <p className="admin-payment-settings__hint" style={{ color: '#b45309', marginTop: '0.75rem' }}>
              Prefix is not set yet. Listing is blocked until you save a 2–3 letter prefix.
            </p>
          )}

          <div className="admin-payment-settings__field" style={{ marginTop: '1rem' }}>
            <label className="admin-payment-settings__label" htmlFor="product-code-prefix">
              Prefix ({PREFIX_MIN}–{PREFIX_MAX} letters)
            </label>
            <input
              id="product-code-prefix"
              type="text"
              className="admin-payment-settings__input admin-payment-settings__input--short"
              value={prefixInput}
              onChange={(e) => setPrefixInput(normalizePrefixDraft(e.target.value))}
              placeholder="FU"
              maxLength={PREFIX_MAX}
              autoComplete="off"
              spellCheck={false}
            />
            <p className="admin-payment-settings__hint">
              Letters only. Same prefix + same number = duplicate blocked. Different prefix =
              different product code series.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="admin-payment-settings__btn-primary"
              onClick={handleSave}
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? 'Saving…' : 'Save prefix'}
            </button>
            <button
              type="button"
              className="admin-payment-settings__btn-secondary"
              onClick={handleReload}
              disabled={updateSettings.isPending}
            >
              <RefreshCw size={14} aria-hidden />
              Refresh
            </button>
            {saveOk && (
              <span className="admin-payment-settings__hint" style={{ alignSelf: 'center', color: '#15803d' }}>
                Saved
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
