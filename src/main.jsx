import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/reset.css'
import '@/styles/globals.css'
import '@/styles/product-form.tailwind.css'
import App from './App.jsx'

if (import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        // New deploy landed — reload so lazy chunks match the current build.
        window.location.reload()
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return
        setInterval(() => {
          registration.update().catch(() => {})
        }, 60 * 60 * 1000)
      },
    })
  })
} else if ('serviceWorker' in navigator) {
  // Clear leftover SW from when PWA ran in dev (breaks Vite lazy imports).
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister())
  })
  if (typeof caches !== 'undefined') {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
