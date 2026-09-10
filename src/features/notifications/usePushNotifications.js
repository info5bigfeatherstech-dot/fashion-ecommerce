import { useEffect, useState } from 'react'
import { isPushSupported, syncPushSubscriptionIfGranted } from '@/utils/pushNotifications'

/**
 * When logged in + Notification.permission === granted, silently sync PushSubscription to API.
 */
export function usePushNotifications(enabled = true) {
  const [supported] = useState(() => isPushSupported())

  useEffect(() => {
    if (!enabled || !supported) return undefined
    if (typeof Notification === 'undefined') return undefined
    if (Notification.permission !== 'granted') return undefined

    let cancelled = false
    ;(async () => {
      if (cancelled) return
      await syncPushSubscriptionIfGranted()
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, supported])

  return { supported }
}
