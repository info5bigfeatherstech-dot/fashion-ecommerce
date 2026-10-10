import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { AdminError, AdminLoading } from '@/features/admin/components/AdminUi'
import {
  useAdminFestiveOfferSettings,
  useUpdateAdminFestiveOfferSettings,
} from '@/features/admin/hooks'

const MAX_LABEL = 48

/**
 * Admin card: enable/disable header festive badge + set display name
 * (e.g. Navratri Special → Diwali Offers). Products are tagged separately
 * via Products → Festive offer marketing flag.
 */
export function AdminFestiveOfferSettingsCard() {
  const { data, isLoading, isError, error, refetch } = useAdminFestiveOfferSettings()
  const update = useUpdateAdminFestiveOfferSettings()

  const [enabled, setEnabled] = useState(false)
  const [label, setLabel] = useState('Festive Offers')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!data) return
    setEnabled(Boolean(data.enabled))
    setLabel(String(data.label || 'Festive Offers').trim() || 'Festive Offers')
    setDirty(false)
  }, [data])

  const handleSave = async () => {
    const nextLabel = String(label || '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, MAX_LABEL)

    if (!nextLabel) {
      toast.error('Badge label is required')
      return
    }

    try {
      await update.mutateAsync({ enabled: Boolean(enabled), label: nextLabel })
      setLabel(nextLabel)
      setDirty(false)
      toast.success(
        enabled
          ? `Festive badge live as “${nextLabel}”`
          : 'Festive badge hidden on storefront'
      )
      refetch()
    } catch (err) {
      toast.error(err?.message || 'Could not save festive offer settings')
    }
  }

  return (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 220, flex: '1 1 280px' }}>
          <p className="body-sm text-muted" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Header badge
          </p>
          <h3 style={{ margin: '4px 0 6px', fontSize: 18 }}>Festive offer</h3>
          <p className="body-sm text-muted" style={{ margin: 0, maxWidth: 420, lineHeight: 1.45 }}>
            Header UI next to “Sale is live”. Set the name (Navratri, Diwali, Christmas…) then tag
            products with <strong>Festive offer</strong> on Products. Shoppers open{' '}
            <code>/shop/festive</code>.
          </p>
        </div>

        {isLoading && <AdminLoading />}
        {isError && <AdminError message={error?.message} onRetry={refetch} />}

        {!isLoading && !isError && (
          <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => {
                  setEnabled(e.target.checked)
                  setDirty(true)
                }}
              />
              <span>
                Show badge on storefront
                {enabled ? (
                  <span className="admin-badge admin-badge--success" style={{ marginLeft: 8 }}>
                    Live
                  </span>
                ) : (
                  <span className="admin-badge admin-badge--warn" style={{ marginLeft: 8 }}>
                    Hidden
                  </span>
                )}
              </span>
            </label>

            <div>
              <label className="body-sm text-muted" style={{ display: 'block', marginBottom: 6 }}>
                Badge label
              </label>
              <input
                className="input"
                value={label}
                maxLength={MAX_LABEL}
                onChange={(e) => {
                  setLabel(e.target.value)
                  setDirty(true)
                }}
                placeholder="e.g. Navratri Special"
                disabled={update.isPending}
              />
              <p className="body-sm text-muted" style={{ margin: '6px 0 0' }}>
                {String(label || '').trim().length}/{MAX_LABEL} characters
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={update.isPending || !dirty}
              >
                {update.isPending ? 'Saving…' : 'Save festive settings'}
              </Button>
              {dirty && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={update.isPending}
                  onClick={() => {
                    setEnabled(Boolean(data?.enabled))
                    setLabel(String(data?.label || 'Festive Offers').trim() || 'Festive Offers')
                    setDirty(false)
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
