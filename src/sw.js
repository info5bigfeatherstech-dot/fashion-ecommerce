/* eslint-disable no-restricted-globals */
import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'

self.skipWaiting()
clientsClaim()

const wbManifest = self.__WB_MANIFEST
precacheAndRoute(Array.isArray(wbManifest) ? wbManifest : [])
cleanupOutdatedCaches()

const spaShellUrl = (Array.isArray(wbManifest) ? wbManifest : [])
  .map((entry) => (typeof entry === 'string' ? entry : entry && entry.url))
  .find(
    (url) =>
      typeof url === 'string' &&
      (url === '/index.html' || url === 'index.html' || url.endsWith('/index.html'))
  )

if (spaShellUrl) {
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL(spaShellUrl), {
      denylist: [/^\/api/],
    })
  )
}

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'fabuniqo-images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
)

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/products'),
  new NetworkFirst({
    cacheName: 'fabuniqo-products-api',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 5,
      }),
    ],
  })
)

function parsePushPayload(event) {
  let data = {}
  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch {
    try {
      data = { body: event.data?.text?.() || '' }
    } catch {
      data = {}
    }
  }
  const nested = data.data && typeof data.data === 'object' ? data.data : {}
  const ctaLabel = data.ctaLabel || nested.ctaLabel || null
  return {
    title: data.title || 'FABUNIQO',
    body: data.body || '',
    icon: data.icon || '/favicon-192.png',
    badge: data.badge || '/favicon-192.png',
    image: data.image || undefined,
    tag: data.tag || 'fabuniqo',
    ctaLabel,
    data: {
      ...nested,
      url: nested.url || data.url || '/',
      ctaLabel: ctaLabel || nested.ctaLabel,
    },
  }
}

self.addEventListener('push', (event) => {
  const payload = parsePushPayload(event)
  const options = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,
    data: payload.data,
    renotify: true,
  }
  // Product image (restock) — Chrome / Edge support `image` for large preview
  if (payload.image) {
    options.image = payload.image
  }
  if (payload.ctaLabel) {
    options.actions = [{ action: 'open', title: String(payload.ctaLabel).slice(0, 40) }]
  }
  event.waitUntil(self.registration.showNotification(payload.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const relativeUrl = event.notification?.data?.url || '/'
  let targetUrl
  try {
    targetUrl = new URL(relativeUrl, self.location.origin).href
  } catch {
    targetUrl = self.location.origin + '/'
  }

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const client of clientList) {
        if (!client.url.startsWith(self.location.origin)) continue
        if ('navigate' in client) {
          try {
            await client.navigate(targetUrl)
          } catch {
            /* ignore navigate failures */
          }
        }
        if ('focus' in client) {
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
      return undefined
    })()
  )
})
