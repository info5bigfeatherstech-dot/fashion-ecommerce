import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  useAdminLeadsPushSettings,
  useUpdateAdminLeadsPushSettings,
} from '@/features/admin/hooks'

function PushChannelToggle({
  label,
  scheduleLabel,
  enabled,
  busy,
  pushConfigured,
  onToggle,
  ariaLabel,
}) {
  const scheduleText = enabled
    ? scheduleLabel || 'Schedule unavailable'
    : 'Off'

  return (
    <div
      className={`admin-leads-autopush${enabled ? ' is-on' : ''}${!pushConfigured ? ' is-disabled' : ''}`}
      title={
        pushConfigured
          ? enabled
            ? `Sends only on: ${scheduleLabel || '—'}`
            : 'Auto push is off'
          : 'Configure VAPID keys on server to enable push'
      }
    >
      <div className="admin-leads-autopush__text">
        <span>{label}</span>
        <small>{scheduleText}</small>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={ariaLabel}
        disabled={busy || !pushConfigured}
        onClick={onToggle}
        className={`pf-toggle pf-toggle--wholesale${enabled ? ' is-on' : ''}`}
      >
        <span className="pf-toggle__knob" />
      </button>
    </div>
  )
}

function resolvePushSettings(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return data.data
  }
  return data
}

export function LeadsAutoPushToggle() {
  const { data, isLoading, isFetching } = useAdminLeadsPushSettings()
  const updateSettings = useUpdateAdminLeadsPushSettings()
  const [cartEnabled, setCartEnabled] = useState(false)
  const [wishlistEnabled, setWishlistEnabled] = useState(false)

  const settings = resolvePushSettings(data)
  const pushConfigured = settings?.pushConfigured !== false
  const cartSchedule =
    String(settings?.cartScheduleSummary || '').trim() ||
    [
      String(settings?.cartReminderDaysLabel || '').trim(),
      settings?.autoPushHourIst != null ? formatHourFallback(settings.autoPushHourIst) : '',
    ]
      .filter(Boolean)
      .join(' · ')
  const wishlistSchedule =
    String(settings?.wishlistScheduleSummary || '').trim() ||
    [
      String(settings?.wishlistReminderDaysLabel || '').trim(),
      settings?.autoWishlistPushHourIst != null
        ? formatHourFallback(settings.autoWishlistPushHourIst)
        : '',
    ]
      .filter(Boolean)
      .join(' · ')

  const busy = isLoading || isFetching || updateSettings.isPending

  useEffect(() => {
    if (!settings) return
    setCartEnabled(Boolean(settings.autoPushEnabled))
    setWishlistEnabled(Boolean(settings.autoWishlistPushEnabled))
  }, [settings, settings?.autoPushEnabled, settings?.autoWishlistPushEnabled])

  const handleCartToggle = async () => {
    if (!pushConfigured) {
      toast.warning('Web push is not configured on the server (VAPID keys).')
      return
    }
    const next = !cartEnabled
    setCartEnabled(next)
    try {
      await updateSettings.mutateAsync({ autoPushEnabled: next })
      toast.success(
        next
          ? `Cart auto push on — ${cartSchedule || 'scheduled days'}`
          : 'Cart auto push off'
      )
    } catch (err) {
      setCartEnabled(!next)
      toast.error(err?.message || 'Could not update cart auto push')
    }
  }

  const handleWishlistToggle = async () => {
    if (!pushConfigured) {
      toast.warning('Web push is not configured on the server (VAPID keys).')
      return
    }
    const next = !wishlistEnabled
    setWishlistEnabled(next)
    try {
      await updateSettings.mutateAsync({ autoWishlistPushEnabled: next })
      toast.success(
        next
          ? `Wishlist auto push on — ${wishlistSchedule || 'scheduled days'}`
          : 'Wishlist auto push off'
      )
    } catch (err) {
      setWishlistEnabled(!next)
      toast.error(err?.message || 'Could not update wishlist auto push')
    }
  }

  return (
    <div className="admin-leads-autopush-group" role="group" aria-label="Auto push channels">
      <PushChannelToggle
        label="Cart auto push"
        scheduleLabel={cartSchedule}
        enabled={cartEnabled}
        busy={busy}
        pushConfigured={pushConfigured}
        onToggle={handleCartToggle}
        ariaLabel="Toggle auto cart reminder push"
      />
      <PushChannelToggle
        label="Wishlist auto push"
        scheduleLabel={wishlistSchedule}
        enabled={wishlistEnabled}
        busy={busy}
        pushConfigured={pushConfigured}
        onToggle={handleWishlistToggle}
        ariaLabel="Toggle auto wishlist reminder push"
      />
    </div>
  )
}

function formatHourFallback(hour) {
  const h = Math.floor(Number(hour))
  if (!Number.isFinite(h) || h < 0 || h > 23) return ''
  if (h === 0) return '12:00 AM IST'
  if (h === 12) return '12:00 PM IST'
  if (h < 12) return `${h}:00 AM IST`
  return `${h - 12}:00 PM IST`
}
