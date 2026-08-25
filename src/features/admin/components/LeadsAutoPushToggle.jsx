import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  useAdminLeadsPushSettings,
  useUpdateAdminLeadsPushSettings,
} from '@/features/admin/hooks'

function formatIstHourLabel(hour) {
  const h = Math.floor(Number(hour))
  if (!Number.isFinite(h) || h < 0 || h > 23) return '6:00 PM IST'
  if (h === 0) return '12:00 AM IST'
  if (h === 12) return '12:00 PM IST'
  if (h < 12) return `${h}:00 AM IST`
  return `${h - 12}:00 PM IST`
}

export function LeadsAutoPushToggle() {
  const { data, isLoading, isFetching } = useAdminLeadsPushSettings()
  const updateSettings = useUpdateAdminLeadsPushSettings()
  const [enabled, setEnabled] = useState(false)

  const settings = data && typeof data === 'object' && !Array.isArray(data)
    ? (data.data && typeof data.data === 'object' ? data.data : data)
    : null
  const pushConfigured = settings?.pushConfigured !== false
  const hourLabel = formatIstHourLabel(settings?.autoPushHourIst ?? 18)
  const busy = isLoading || isFetching || updateSettings.isPending

  useEffect(() => {
    if (settings) setEnabled(Boolean(settings.autoPushEnabled))
  }, [settings, settings?.autoPushEnabled])

  const handleToggle = async () => {
    if (!pushConfigured) {
      toast.warning('Web push is not configured on the server (VAPID keys).')
      return
    }
    const next = !enabled
    setEnabled(next)
    try {
      await updateSettings.mutateAsync({ autoPushEnabled: next })
      toast.success(next ? `Auto cart push enabled (daily ~${hourLabel})` : 'Auto cart push disabled')
    } catch (err) {
      setEnabled(!next)
      toast.error(err?.message || 'Could not update auto push setting')
    }
  }

  return (
    <div
      className={`admin-leads-autopush${enabled ? ' is-on' : ''}${!pushConfigured ? ' is-disabled' : ''}`}
      title={
        pushConfigured
          ? `Daily auto push at ~${hourLabel} for cart users who allowed notifications`
          : 'Configure VAPID keys on server to enable push'
      }
    >
      <div className="admin-leads-autopush__text">
        <span>Auto push</span>
        <small>{enabled ? `On · ~${hourLabel}` : 'Off'}</small>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Toggle auto cart reminder push"
        disabled={busy || !pushConfigured}
        onClick={handleToggle}
        className={`pf-toggle pf-toggle--wholesale${enabled ? ' is-on' : ''}`}
      >
        <span className="pf-toggle__knob" />
      </button>
    </div>
  )
}
