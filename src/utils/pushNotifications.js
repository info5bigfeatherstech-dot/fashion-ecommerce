import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/api/endpoints'

const SW_READY_TIMEOUT_MS = 12000

function waitForServiceWorkerReady(timeoutMs = SW_READY_TIMEOUT_MS) {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('Service worker is not ready. Refresh the page and try again.')),
        timeoutMs
      )
    }),
  ])
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function fetchVapidPublicKey() {
  const res = await http.get(API_ENDPOINTS.push.vapidPublicKey, { skipAuthRefresh: true })
  if (!res?.configured || !res?.publicKey) return null
  return res.publicKey
}

export async function getPushStatus() {
  return http.get(API_ENDPOINTS.push.status)
}

export async function subscribeToWebPush() {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported on this device')
  }

  const publicKey = await fetchVapidPublicKey()
  if (!publicKey) {
    throw new Error('Push notifications are not configured on the server')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted')
  }

  const registration = await waitForServiceWorkerReady(12000)
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const json = subscription.toJSON()
  await http.post(API_ENDPOINTS.push.subscribe, {
    endpoint: json.endpoint,
    keys: json.keys,
  })

  return subscription
}

export async function syncPushSubscriptionIfGranted() {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return { synced: false, reason: 'not_granted' }
  }

  try {
    const status = await getPushStatus()
    const registration = await waitForServiceWorkerReady(12000)
    const existing = await registration.pushManager.getSubscription()

    if (status?.subscribed && existing) {
      return { synced: true, reason: 'already_subscribed' }
    }

    await subscribeToWebPush()
    return { synced: true, reason: 'subscribed' }
  } catch {
    return { synced: false, reason: 'sync_failed' }
  }
}
